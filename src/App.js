import './App.css';
import React, { Component, createRef } from 'react';
import { DataSet, DataView } from 'vis-data';
import { Network } from 'vis-network';

var $ = require('jquery');
var csv = require('jquery-csv');

const [nodes, edges] = [new DataSet(), new DataSet()];
const [red, blue, yellow] = ["#d63031", "#2980b9", "#fdcb6e"];

$.ajax({
  url: 'data.csv',
  success: (data) => {
    const objects = csv.toObjects(data);
    objects.forEach((entry, i) => {
      let { "Name": label, "Ate Row": ate_id, "Kuya Row": kuya_id } = entry;
      const id = i + 2; // add 2 to account for header and 0 index start of iterator i

      nodes.add({ id: id, label: label });
      if (ate_id !== "") {
        ate_id = Number(ate_id)
        edges.add(
          {
            from: id,
            to: ate_id,
            color: { color: red, highlight: red },
            relation: "ate",
          }
        );
        edges.add(
          {
            from: ate_id,
            to: id,
            color: { color: yellow, highlight: yellow },
            relation: "ading",
          }
        )
      }
      if (kuya_id !== "") {
        kuya_id = Number(kuya_id)
        edges.add(
          {
            from: id,
            to: kuya_id,
            color: { color: blue, highlight: blue },
            relation: "kuya",
          }
        );
        edges.add(
          {
            from: kuya_id,
            to: id,
            color: { color: yellow, highlight: yellow },
            relation: "ading",
          }
        )
      }
    });
  }
})

const options = {
  autoResize: true,
  height: '100%',
  width: '100%',
  locale: 'en',
  nodes: {
    borderWidth: 2,
    borderWidthSelected: 3,
    color: {
      border: '#fdcb6e',
      background: '#ffeaa7',
      highlight: {
        border: '#fdcb6e',
        background: '#fdcb6e'
      }
    }
  },
  edges: {
    width: 3,
    arrows: {
      to: { enabled: true, type: 'arrow' }
    },
    scaling: {
      label: true,
    },
    shadow: true,
    smooth: {
      enabled: true,
      type: 'dynamic',
      roundness: 0.5
    }
  },
  layout: {
    improvedLayout: false,
  },
  physics: {
    enabled: true,
    solver: 'forceAtlas2Based'
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      searchValue: "",
      displayedNodes: new Set(),
      filterShown: false,
    };
    this.nodesView = new DataView(nodes, { filter: this.nodesFilter });
    this.edgesView = new DataView(edges, { filter: this.edgesFilter });
    this.network = {};
    this.appRef = createRef();
  }

  nodesFilter = (node) => {
    return !this.state.filterShown || this.state.displayedNodes.has(node.id);
  }

  edgesFilter = (edge) => (edge.relation !== "ading");

  componentDidMount() {
    this.network = new Network(
      this.appRef.current,
      { nodes: this.nodesView, edges: this.edgesView },
      options,
    );
  }

  reset = (e, callback = null) => {
    this.setState({ filterShown: false }, () => {
      this.nodesView.refresh();
      if (callback !== null) {
        callback();
      }
    });
  }

  getSearchedNode = () => {
    return nodes.get({
      filter: (node) => node.label.toLowerCase() === this.state.searchValue.toLowerCase()
    })[0];
  }

  showSuccessors = () => {
    this.reset(null, () => {
      const searchedNode = this.getSearchedNode();
      if (searchedNode !== undefined) {
        const nodesToDisplay = this.getConnected(searchedNode.id, "from");
        this.setState({ displayedNodes: nodesToDisplay, filterShown: true }, () => {
          this.nodesView.refresh();
        });
      }
    });
  }

  showPredecessors = () => {
    this.reset(null, () => {
      const searchedNode = this.getSearchedNode();
      if (searchedNode !== undefined) {
        const nodesToDisplay = this.getConnected(searchedNode.id, "to");
        this.setState({ displayedNodes: nodesToDisplay, filterShown: true }, () => {
          this.nodesView.refresh();
        });
      }
    });
  }

  handleSearchChange = (e) => {
    this.setState({ searchValue: e.target.value })
  }

  getConnected = (node, direction = "any") => {
    const successors = new Set();
    let queue = [];
    queue.push(node);

    while (queue.length !== 0) {
      let level_size = queue.length;
      for (let i = 0; i < level_size; i++) {
        let temp = queue.shift();
        successors.add(temp);
        this.network.getConnectedNodes(temp, direction).forEach((item) => {
          if (!successors.has(item)) {
            queue.push(item);
          }
        });
      }
    }
    return successors;
  }

  render() {
    return (
      <div>
        <input type="text" placeholder="Search Web" aria-label="Search Web" value={this.state.searchValue} onChange={this.handleSearchChange} />
        <button type="button" onClick={this.reset}>Reset</button>
        <button type="button" onClick={this.showSuccessors}>Show Successors</button>
        <button type="button" onClick={this.showPredecessors}>Show Predecessors</button>
        <div ref={this.appRef} id="mynetwork" />
      </div>
    );
  }
}

export default App;
