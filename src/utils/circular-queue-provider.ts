import { Observer } from 'src/endpoints/proxy/entities/observer';

export class CircularQueueProvider {
  private _nodes: Observer[];
  private _nodesMap: Map<number, Observer[]>;
  private _countersMap: Map<number, number>;
  private _counterForAllNodes: number;

  constructor(nodes: Observer[]) {
    if (nodes.length === 0) {
      throw new Error('Empty observers list');
    }

    this._nodesMap = this.initNodesMap(nodes);
    this._nodes = this.initAllNodes(this._nodesMap);
    this._counterForAllNodes = -1;
    this._countersMap = new Map();
  }

  getNodesByShardId(shardId: number): Observer[] {
    const nodesForShard = this._nodesMap.get(shardId) ?? [];
    if (nodesForShard.length === 0) {
      throw new Error(
        "The specified shard ID does not exist in proxy's configuration",
      );
    }

    const index = this.computeCounterForShard(shardId, nodesForShard.length);
    const nodes = this.getArrayCycle(nodesForShard, index);
    return nodes;
  }

  getAllNodes(): Observer[] {
    const index = this.computeCounterForNodes(this._nodes.length);
    const nodes = this.getArrayCycle(this._nodes, index);
    return nodes;
  }

  private computeCounterForShard(shardId: number, nodesLength: number): number {
    const counter = this._countersMap.get(shardId) ?? -1;
    const newCounter = (counter + 1) % nodesLength;
    this._countersMap.set(shardId, newCounter);
    return newCounter;
  }

  private computeCounterForNodes(nodesLength: number): number {
    this._counterForAllNodes = (this._counterForAllNodes + 1) % nodesLength;
    return this._counterForAllNodes;
  }

  private initNodesMap(nodes: Observer[]): Map<number, Observer[]> {
    const nodesMap = new Map();
    for (const node of nodes) {
      if (!nodesMap.has(node.shardId)) {
        nodesMap.set(node.shardId, []);
      }
      nodesMap.get(node.shardId)?.push(node);
    }
    return nodesMap;
  }

  private initAllNodes(nodesMap: Map<number, Observer[]>): Observer[] {
    const allNodes = [];
    const sortedShards = Array.from(nodesMap.keys()).sort();
    const counterMap = new Map<number, number>(
      sortedShards.map((shard) => [shard, 0]),
    );
    const nodesLength = Array.from(nodesMap.values()).length;
    for (let step = 0; step < nodesLength; ) {
      for (const shard of sortedShards) {
        const currentNodes = nodesMap.get(shard) ?? [];
        const index = counterMap.get(shard) ?? 0;
        if (index >= currentNodes.length) {
          continue;
        }

        allNodes.push(currentNodes[index]);

        step++;
        counterMap.set(shard, index + 1);
      }
    }
    return allNodes;
  }

  private getArrayCycle<T>(array: T[], index: number): T[] {
    const newArray = [
      ...array.slice(index, array.length),
      ...array.slice(0, index),
    ];
    return newArray;
  }
}
