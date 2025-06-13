'use client';

import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface GraphRendererProps {
  content: string;
  className?: string;
}

interface ParsedNode {
  id: string;
  label: string;
  level: number;
  parent?: string;
}

const parseGraphContent = (content: string): { nodes: Node[], edges: Edge[] } => {
  const lines = content.split('\n').filter(line => line.trim());
  const parsedNodes: ParsedNode[] = [];
  
  lines.forEach((line, index) => {
    // Parse lines like "A --> B[Navigate]" or "A[Tool_Base] --> B[Browser Tool]"
    const arrowMatch = line.match(/^(\w+)(?:\[([^\]]+)\])?\s*-->\s*(\w+)(?:\[([^\]]+)\])?/);
    if (arrowMatch) {
      const [, fromId, fromLabel, toId, toLabel] = arrowMatch;
      
      // Add from node if not exists
      if (!parsedNodes.find(n => n.id === fromId)) {
        parsedNodes.push({
          id: fromId,
          label: fromLabel || fromId,
          level: 0
        });
      }
      
      // Add to node if not exists
      if (!parsedNodes.find(n => n.id === toId)) {
        parsedNodes.push({
          id: toId,
          label: toLabel || toId,
          level: 1,
          parent: fromId
        });
      }
    }
  });

  // Convert to React Flow format
  const nodes: Node[] = parsedNodes.map((node, index) => {
    const x = (index % 4) * 250;
    const y = node.level * 150 + (Math.floor(index / 4) * 100);
    
    return {
      id: node.id,
      position: { x, y },
      data: { 
        label: node.label,
      },
      style: {
        background: node.level === 0 ? '#6366f1' : '#10b981',
        color: 'white',
        border: '1px solid #222',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '12px',
        fontWeight: 'bold',
        minWidth: '120px',
        textAlign: 'center',
      },
      type: 'default',
    };
  });

  const edges: Edge[] = [];
  lines.forEach((line) => {
    const arrowMatch = line.match(/^(\w+)(?:\[([^\]]+)\])?\s*-->\s*(\w+)(?:\[([^\]]+)\])?/);
    if (arrowMatch) {
      const [, fromId, , toId] = arrowMatch;
      edges.push({
        id: `${fromId}-${toId}`,
        source: fromId,
        target: toId,
        type: 'smoothstep',
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: {
          type: 'arrowclosed',
          width: 20,
          height: 20,
          color: '#6366f1',
        },
      });
    }
  });

  return { nodes, edges };
};

export default function GraphRenderer({ content, className }: GraphRendererProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => 
    parseGraphContent(content), [content]
  );
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (!initialNodes.length) {
    return (
      <div className={`bg-gray-100 p-4 rounded-lg ${className || ''}`}>
        <pre className="text-sm">{content}</pre>
      </div>
    );
  }

  return (
    <div className={`h-96 border rounded-lg ${className || ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls position="top-left" />
        <MiniMap 
          position="top-right"
          nodeColor={(node) => node.style?.background as string || '#6366f1'}
        />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
} 