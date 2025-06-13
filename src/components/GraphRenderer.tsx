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
  MarkerType,
  BackgroundVariant,
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
  const lines = content.split('\n').filter(line => line.trim() && !line.includes('graph TD'));
  const parsedNodes: ParsedNode[] = [];
  const nodeConnections: { [key: string]: string[] } = {};
  
  lines.forEach((line) => {
    // Parse lines like "A --> B[Navigate]" or "A[Tool_Base] --> B[Browser Tool]"
    // Also handle spaces around arrows
    const arrowMatch = line.match(/^\s*(\w+)(?:\[([^\]]+)\])?\s*-->\s*(\w+)(?:\[([^\]]+)\])?\s*$/);
    if (arrowMatch) {
      const [, fromId, fromLabel, toId, toLabel] = arrowMatch;
      
      // Track connections for better layout
      if (!nodeConnections[fromId]) nodeConnections[fromId] = [];
      nodeConnections[fromId].push(toId);
      
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

  // Calculate levels for better hierarchy
  const calculateLevels = () => {
    const visited = new Set<string>();
    const levels: { [key: string]: number } = {};
    
    // Find root nodes (nodes with no incoming connections)
    const incomingConnections = new Set<string>();
    Object.values(nodeConnections).flat().forEach(id => incomingConnections.add(id));
    const rootNodes = parsedNodes.filter(node => !incomingConnections.has(node.id));
    
    // BFS to assign levels
    const queue = rootNodes.map(node => ({ id: node.id, level: 0 }));
    
    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (visited.has(id)) continue;
      
      visited.add(id);
      levels[id] = level;
      
      if (nodeConnections[id]) {
        nodeConnections[id].forEach(childId => {
          if (!visited.has(childId)) {
            queue.push({ id: childId, level: level + 1 });
          }
        });
      }
    }
    
    return levels;
  };
  
  const levels = calculateLevels();

  // Convert to React Flow format with better positioning
  const levelGroups: { [level: number]: ParsedNode[] } = {};
  parsedNodes.forEach(node => {
    const level = levels[node.id] || 0;
    if (!levelGroups[level]) levelGroups[level] = [];
    levelGroups[level].push(node);
  });

  const nodes: Node[] = parsedNodes.map((node) => {
    const level = levels[node.id] || 0;
    const levelNodes = levelGroups[level];
    const indexInLevel = levelNodes.indexOf(node);
    const totalInLevel = levelNodes.length;
    
    // Center nodes horizontally within their level
    const levelWidth = Math.max(totalInLevel * 200, 400);
    const startX = -levelWidth / 2;
    const x = startX + (indexInLevel + 0.5) * (levelWidth / totalInLevel);
    const y = level * 120;
    
    return {
      id: node.id,
      position: { x, y },
      data: { 
        label: node.label,
      },
      style: {
        background: level === 0 
          ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
          : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        padding: '12px 16px',
        fontSize: '14px',
        fontWeight: 'bold',
        minWidth: '140px',
        textAlign: 'center',
        boxShadow: '0 8px 25px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)',
      },
      type: 'default',
    };
  });

  const edges: Edge[] = [];
  lines.forEach((line) => {
    const arrowMatch = line.match(/^\s*(\w+)(?:\[([^\]]+)\])?\s*-->\s*(\w+)(?:\[([^\]]+)\])?\s*$/);
    if (arrowMatch) {
      const [, fromId, , toId] = arrowMatch;
      edges.push({
        id: `${fromId}-${toId}`,
        source: fromId,
        target: toId,
        type: 'smoothstep',
        style: { 
          stroke: '#6366f1', 
          strokeWidth: 3,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
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
  
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
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
    <div className={`h-[500px] w-full border rounded-lg bg-gradient-to-br from-slate-50 to-blue-50 shadow-lg ${className || ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 50 }}
        attributionPosition="bottom-left"
        minZoom={0.2}
        maxZoom={2}
      >

        <Controls 
          position="top-left" 
          showZoom={true} 
          showFitView={true} 
          showInteractive={false}
          style={{ 
            background: 'rgba(255, 255, 255, 0.9)', 
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <MiniMap 
          position="top-right"
          nodeColor={(node) => node.style?.background as string || '#6366f1'}
          style={{ 
            background: 'rgba(255, 255, 255, 0.9)', 
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={20} 
          size={1.5} 
          color="rgba(59, 130, 246, 0.15)"
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)'
          }}
        />
      </ReactFlow>
    </div>
  );
} 