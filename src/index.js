import './style.scss';

import { Netmask, IP } from 'netmask6';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';

class HextetInputs extends Component {
  render() {
    const hextetInputs = this.props.hextets.map((hextet, i) => (
      <span className="hextet" key={i}>
        <input
          className="hextet"
          type="text"
          data-hextet-id={i}
          onChange={this.props.onChange}
          onKeyDown={this.props.onKeyDown}
          onPaste={this.props.onPaste}
          value={hextet.toString(16)}
        />
        <span className="dot">{i == '7' ? '/' : ':'}</span>
      </span>
    ));
    return (
      <div className="address">
        {hextetInputs}
        <input
          className="cidr"
          type="text"
          data-hextet-id="cidr"
          onChange={this.props.onChange}
          onKeyDown={this.props.onKeyDown}
          value={this.props.cidr}
        />
      </div>
    );
  }
}

class BitMap extends Component {
  render() {
    return (
      <div className="bits">
        <ol>
          {
            [...Array(8)].map((_, hextet) => (
              <Hextet
                key={hextet}
                value={this.props.hextets[hextet]}
                hextetId={hextet}
                cidr={this.props.cidr}
              />
            ))
          }
        </ol>
      </div>
    );
  }
}

class Hextet extends Component {
  render() {
    const octets = [...Array(2)].map((_, byte) => {
      const hextetVal = this.props.value;
      const octetId = 2 * this.props.hextetId + byte;
      const octet = byte == 0 ? hextetVal >> 8 : hextetVal & 0x00ff;
      const maskStartIndex = Math.max(0, Math.min(8, this.props.cidr - octetId * 8));
      return (
        <Octet
          key={octetId}
          octet={octet}
          maskStartIndex={maskStartIndex}
        />
      );
    });
    return (
      <div>
        {octets}
      </div>
    );
  }
}

class Octet extends Component {
  render() {
    return (
      <li className="octet">
        <ol>
          {
            [...Array(8)].map((_, bitIndex) => (
              <Bit key={bitIndex}
                   value={(this.props.octet & (1 << (7 - bitIndex))) >> (7 - bitIndex)}
                   masked={this.props.maskStartIndex <= bitIndex}
              />
            ))
          }
        </ol>
      </li>
    );
  }
}

class Bit extends Component {
  render() {
    return (
      <li
        className={ this.props.masked ? 'bit masked': 'bit unmasked'}
      >
        {this.props.value}
      </li>
    );
  }
}

class IPV6Address extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hextets: [0x2001, 0xdb8, 0x85a3, 0x0, 0x0, 0x8a2e, 0x370, 0x7334],
      cidr: 56
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handlePaste = this.handlePaste.bind(this);
  }

  parseIpv6Cidr(value) {
    let ipCandidate = value;
    let cidrCandidate = null;
    let cidr = null;
    const noMatch = { ip: null, cidr: null };

    if (value.includes('/')) {
      [ipCandidate, cidrCandidate] = value.split('/');
      try {
        cidr = Number.parseInt(cidrCandidate, 10);
      } catch (err) {
        return noMatch;
      }
    }

    let ip;
    try {
      ip = IP.v6.parse(ipCandidate).groups;
    } catch (err) {
      return noMatch;
    };

    return { ip, cidr };
  }

  handlePaste(event) {
    const { ip, cidr } = this.parseIpv6Cidr(event.clipboardData.getData('Text'));
    console.log('ip', ip);
    if (ip) {
      this.setState({
        hextets: ip,
        cidr: cidr == null ? this.state.cidr : cidr,
      });
    }

  }

  handleChange(event) {
    const hextets = this.state.hextets;
    
    let targetVal = event.target.value.replace(/[^0-9a-f]/g, '');
    if (targetVal == '') {
      targetVal = 0;
    }

    const hextetId = event.target.attributes['data-hextet-id'].value;
    const val = Number.parseInt(targetVal, hextetId === 'cidr' ? 10 : 16);
    if (Number.isNaN(val)) {
      return;
    }

    if (hextetId == 'cidr') {
      if (val <= 128) {
        this.setState({
          cidr: val
        });
      }
    } else {
      if (val <= 0xffff) {
        hextets[hextetId] = val;
        this.setState({ hextets });
      }
    }
  }

  handleKeyDown(event) {
    const base = event.target.dataset.hextetId === 'cidr' ? 10 : 16;
    const maxValue = event.target.dataset.hextetId === 'cidr' ? 128 : 0xffff;
    const val = Number.parseInt(event.target.value, base);

    if (event.key === 'ArrowDown') {
      const newVal = val - 1;
      event.target.value = (newVal < 0 ? maxValue : newVal).toString(base);
      this.handleChange(event);
    }

    if (event.key === 'ArrowUp') {
      const newVal = val + 1;
      event.target.value = (newVal > maxValue ? 0 : newVal).toString(base);
      this.handleChange(event);
    }
 
    if (event.key === ':') {
      event.preventDefault();
      const hextetInput = event.target.parentNode.nextSibling.firstChild;
      if (hextetInput instanceof HTMLInputElement) {
        hextetInput.select();
        hextetInput.focus();
      };
    };
    if (event.key === '/') {
      event.preventDefault();
      var maskInput = event.target.parentNode.nextSibling;
      if (maskInput instanceof HTMLInputElement) {
        maskInput.select();
        maskInput.focus();
      }
    }
  }

  render() {
    const netmask = new Netmask.v6(new IP.v6(this.state.hextets), this.state.cidr);
    return (
      <div className="ip-address">
        <HextetInputs
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          onPaste={this.handlePaste}
          hextets={this.state.hextets}
          cidr={this.state.cidr}
        />
        <BitMap hextets={this.state.hextets} cidr={this.state.cidr} />

	<div className="details">
          <div className="cell">
            <span className="value">{ netmask.firstIP.toString() }</span>
            <span className="label">Range start</span>
          </div>
          <div className="cell">
            <span className="value">{ netmask.lastIP.toString() }</span>
            <span className="label">Range end</span>
          </div>
          <div className="cell">
            <span className="value">{ netmask.size.toLocaleString() }</span>
            <span className="label">Count</span>
          </div>
       </div>
      </div>
    );
  }
};

ReactDOM.render(<IPV6Address />, document.getElementById('app'));
