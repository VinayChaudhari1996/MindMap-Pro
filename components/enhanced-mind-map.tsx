"use client"

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Node,
  Edge,
  ConnectionLineType,
  MarkerType,
  NodeProps,
  Handle,
  Position,
  BaseEdge,
  EdgeProps,
  getSmoothStepPath,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Plus, Maximize2, X, Moon, Sun, Check, RefreshCw, ChevronLeft, ChevronRight, Edit2, Download, Workflow, Ellipsis, Palette, SprayCan, Eraser } from 'lucide-react'
import { Editor } from "@monaco-editor/react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import katex from 'katex'
import 'katex/dist/katex.min.css'
import { toPng, toJpeg, toSvg } from 'html-to-image'
import { createGIF } from 'gifshot'
import { ChromePicker } from 'react-color'
import * as LucideIcons from 'lucide-react'

// Styles for edge animations
const edgeAnimationStyles = `
@keyframes flowAnimation {
  from {
    stroke-dashoffset: 24;
  }
  to {
    stroke-dashoffset: 0;
  }
}

.animate-edge-flow {
  animation: flowAnimation 3s linear infinite;
}
`

// AnimatedSVGEdge component
const AnimatedSVGEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <circle r="4" fill="#ff0073">
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </>
  );
};

// CustomNode component
const CustomNode: React.FC<NodeProps> = ({ data, id }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedLabel, setEditedLabel] = useState(data.label)
  const [selectedIcon, setSelectedIcon] = useState<string | null>(data.icon || null)
  const [isHovered, setIsHovered] = useState(false)

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    setIsEditing(false)
    data.onNodeChange(id, editedLabel, selectedIcon)
  }

  const handleCollapse = () => {
    data.onNodeCollapse(id)
  }

  const handleDelete = () => {
    data.onNodeDelete(id)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
    data.onNodeHover(id, true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    data.onNodeHover(id, false)
  }

  const renderKatex = (text: string) => {
    return text.replace(/\$\$(.*?)\$\$/g, (match, formula) => {
      try {
        return katex.renderToString(formula, { throwOnError: false, displayMode: true })
      } catch (error) {
        console.error('KaTeX rendering error:', error)
        return match
      }
    })
  }

  const renderIcon = () => {
    if (selectedIcon && LucideIcons[selectedIcon as keyof typeof LucideIcons]) {
      const IconComponent = LucideIcons[selectedIcon as keyof typeof LucideIcons]
      return <IconComponent size={16} className="mr-2" />
    }
    return null
  }

  return (
    <div 
      className={`w-full p-3 border shadow-none rounded-lg transition-all duration-200 ${data.color} ${isEditing ? 'max-w-[300px] ring-2 ring-blue-500' : 'max-w-[200px]'} group hover:shadow-none hover:border-gray-400`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleEdit}
    >
      <div className="flex items-center space-x-2">
        {isEditing ? (
          <div className="flex flex-col w-full">
            <input
              type="text"
              value={editedLabel}
              onChange={(e) => setEditedLabel(e.target.value)}
              className="text-sm font-medium mb-2 p-2 border rounded w-full"
              autoFocus
            />
            <select
              value={selectedIcon || ''}
              onChange={(e) => setSelectedIcon(e.target.value)}
              className="text-sm font-medium mb-2 p-2 border rounded w-full"
            >
              <option value="">No Icon</option>
              {Object.keys(LucideIcons).map((iconName) => (
                <option key={iconName} value={iconName}>{iconName}</option>
              ))}
            </select>
            <div className="flex justify-between">
              <Button onClick={handleSave} variant="default" size="sm" className="flex items-center">
                <Check size={12} className="mr-1" /> Save
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="destructive" size="sm" className="flex items-center">
                <X size={12} className="mr-1" /> Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="cursor-pointer flex-grow flex items-center">
              {renderIcon()}
              <div 
                className="text-sm font-bold" 
                dangerouslySetInnerHTML={{ __html: renderKatex(data.label) }} 
              />
              {data.content && isHovered && (
                <div 
                  className="text-xs mt-1 text-gray-600 dark:text-gray-400" 
                >
                  Click to edit
                </div>
              )}
            </div>
            <div className="flex items-center">
              {isHovered && (
                <>
                  <Button onClick={handleEdit} variant="ghost" size="sm" className="ml-2 p-1">
                    <Edit2 size={16} />
                  </Button>
                  <Button onClick={handleDelete} variant="ghost" size="sm" className="ml-2 p-1 text-gray-500 hover:text-red-500">
                    <X size={16} />
                  </Button>
                </>
              )}
              <Button onClick={handleCollapse} variant="ghost" size="sm" className="ml-2 p-1 text-gray-500 hover:text-gray-700">
                {data.isCollapsed ? (
                  <span className="flex items-center">
                    <Plus size={16} />
                    <span className="ml-1 text-xs">{data.childCount}</span>
                  </span>
                ) : (
                  '-'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ background: data.selectedEdgeColor }} // Use data.selectedEdgeColor
        isConnectable={true}
      />
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ background: data.selectedEdgeColor }} // Use data.selectedEdgeColor
        isConnectable={true}
      />
    </div>
  )
}

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    position: { x: 0, y: 0 },
    data: { label: 'Feature Definition', color: 'bg-blue-100 border-blue-300 dark:bg-blue-900 dark:border-blue-700' },
  },
]

const initialEdges: Edge[] = []

export function EnhancedMindMap() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [documentText, setDocumentText] = useState(`# Family
  - Men
    - Father
      - Father's work
      - Father's hobbies
        - Reading
        - Sports
    - Uncle
      - Uncle's work
      - Uncle's hobbies
        - Fishing
        - Music`)

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [isDocumentCollapsed, setIsDocumentCollapsed] = useState(false)
  const [selectedEdgeType, setSelectedEdgeType] = useState('default')
  const [selectedEdgeFormat, setSelectedEdgeFormat] = useState('normal')
  const [selectedBackgroundColor, setSelectedBackgroundColor] = useState('#ffffff')
  const [selectedEdgeColor, setSelectedEdgeColor] = useState('#000000')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [customColor, setCustomColor] = useState('#000000')

  const edgeTypes = [
    { label: 'Default (Bezier)', value: 'default' },
    { label: 'Straight', value: 'straight' },
    { label: 'Step', value: 'step' },
    { label: 'Smooth Step', value: 'smoothstep' },
    { label: 'Animated SVG', value: 'animatedSvg' },
  ]

  const edgeFormats = [
    { label: 'Normal', value: 'normal' },
    { label: 'Dotted', value: 'dotted' },
  ]

  const backgroundColors = [
    { label: 'White', value: '#ffffff' },
    { label: 'Light Gray', value: '#f0f0f0' },
    { label: 'Light Blue', value: '#e6f3ff' },
    { label: 'Light Green', value: '#e6fff0' },
    { label: 'Light Yellow', value: '#fffde6' },
  ]

  const edgeColors = [
    { label: 'Black', value: '#000000' },
    { label: 'Gray', value: '#808080' },
    { label: 'Red', value: '#FF0000' },
    { label: 'Blue', value: '#0000FF' },
    { label: 'Green', value: '#008000' },
    { label: 'Custom', value: 'custom' },
  ]

  const flowStyles = useMemo(() => ({
    stroke: selectedEdgeColor,
    strokeWidth: 2,
  }), [selectedEdgeColor])

  const handleEdgeTypeChange = (type: string) => {
    setSelectedEdgeType(type)
    updateEdges(type, selectedEdgeFormat)
  }

  const handleEdgeFormatChange = (format: string) => {
    setSelectedEdgeFormat(format)
    updateEdges(selectedEdgeType, format)
  }

  const updateEdges = (type: string, format: string) => {
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        type,
        animated: type === 'default',
        className: type === 'default' ? 'animate-edge-flow' : '',
        style: {
          ...flowStyles,
          strokeDasharray: format === 'dotted' ? '5, 5' : 'none',
        },
      }))
    )
  }

  const handleNodeHover = useCallback((id: string, isHovered: boolean) => {
    setHoveredNodeId(isHovered ? id : null)
  }, [])

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ 
      ...params, 
      type: selectedEdgeType, 
      style: { 
        ...flowStyles,
        strokeDasharray: selectedEdgeFormat === 'dotted' ? '5, 5' : 'none',
      },
      animated: selectedEdgeType === 'default',
      className: selectedEdgeType === 'default' ? 'animate-edge-flow' : '',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: selectedEdgeColor,
      },
    }, eds)),
    [setEdges, flowStyles, selectedEdgeType, selectedEdgeFormat, selectedEdgeColor]
  )

  const handleNodeChange = useCallback((id: string, newLabel: string, newIcon: string | null) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, label: newLabel, icon: newIcon } }
        }
        return node
      })
    )
  }, [setNodes])

  const handleNodeCollapse = useCallback((id: string) => {
    setNodes((nds) => {
      const updatedNodes = nds.map((node) => {
        if (node.id === id) {
          const childCount = edges.filter(edge => edge.source === id).length
          return { 
            ...node, 
            data: { 
              ...node.data, 
              isCollapsed: !node.data.isCollapsed,
              childCount: childCount
            } 
          }
        }
        return node
      })

      const toggledNode = updatedNodes.find((node) => node.id === id)
      if (toggledNode) {
        const isCollapsed = toggledNode.data.isCollapsed

        const hideChildren = (nodeId: string) => {
          updatedNodes.forEach((node) => {
            const edge = edges.find((e) => e.source === nodeId && e.target === node.id)
            if (edge) {
              node.hidden = isCollapsed
              hideChildren(node.id)
            }
          })
        }

        hideChildren(id)
      }

      return updatedNodes
    })

    setEdges((eds) =>
      eds.map((edge) => {
        if (edge.source === id) {
          return { ...edge, hidden: !edge.hidden }
        }
        return edge
      })
    )
  }, [setNodes, setEdges, edges])

  const handleNodeDelete = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id))
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id))
  }, [setNodes, setEdges])

  const parseDocumentText = useCallback((text: string) => {
    const lines = text.split('\n')
    const newNodes: Node[] = []
    const newEdges: Edge[] = []
    let id = 1
    let parentStack: { id: number; level: number }[] = []

    const colors = [
      'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-700/50',
      'bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-700/50',
      'bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:border-purple-700/50',
      'bg-pink-50 border-pink-200 dark:bg-pink-900/30 dark:border-pink-700/50',
      'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700/50',
      'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-700/50',
    ]

    const calculateNodePosition = (level: number, index: number) => {
      const xSpacing = 300
      const ySpacing = 100
      const xOffset = level * xSpacing
      const yOffset = index * ySpacing - (level * 100)
      return { x: xOffset, y: yOffset }
    }

    lines.forEach((line, index) => {
      const level = line.search(/\S/) / 2
      const label = line.trim().replace(/^[-*#]\s*/, '')

      if  (label) {
        const position = calculateNodePosition(level, index)
        const node: Node = {
          id: id.toString(),
          type: 'custom',
          position,
          data: { 
            label, 
            color: colors[level % colors.length],
            content: level > 0 ? 'Click to edit' : '',
            onNodeChange: handleNodeChange,
            onNodeCollapse: handleNodeCollapse,
            onNodeDelete: handleNodeDelete,
            onNodeHover: handleNodeHover,
            isCollapsed: false,
            childCount: 0,
            selectedEdgeColor, // Add this line
          },
        }
        
        newNodes.push(node)

        if (parentStack.length > 0 && level > parentStack[parentStack.length - 1].level) {
          newEdges.push({
            id: `e${parentStack[parentStack.length - 1].id}-${id}`,
            source: parentStack[parentStack.length - 1].id.toString(),
            target: id.toString(),
            type: selectedEdgeType,
            style: { 
              ...flowStyles,
              strokeDasharray: selectedEdgeFormat === 'dotted' ? '5, 5' : 'none',
            },
            animated: selectedEdgeType === 'default',
            className: selectedEdgeType === 'default' ? 'animate-edge-flow' : '',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: selectedEdgeColor,
            },
          })
        } else {
          while (parentStack.length > 0 && level <= parentStack[parentStack.length - 1].level) {
            parentStack.pop()
          }
          if (parentStack.length > 0) {
            newEdges.push({
              id: `e${parentStack[parentStack.length - 1].id}-${id}`,
              source: parentStack[parentStack.length - 1].id.toString(),
              target: id.toString(),
              type:  selectedEdgeType,
              style: { 
                ...flowStyles,
                strokeDasharray: selectedEdgeFormat === 'dotted' ? '5, 5' : 'none',
              },
              animated: selectedEdgeType === 'default',
              className: selectedEdgeType === 'default' ? 'animate-edge-flow' : '',
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: selectedEdgeColor,
              },
            })
          }
        }

        parentStack.push({ id, level })
        id++
      }
    })

    // Calculate child count for each node
    newNodes.forEach((node) => {
      const childCount = newEdges.filter(edge => edge.source === node.id).length
      node.data.childCount = childCount
    })

    setNodes(newNodes)
    setEdges(newEdges)
  }, [setNodes, setEdges, handleNodeChange, handleNodeCollapse, handleNodeDelete, handleNodeHover, selectedEdgeType, selectedEdgeFormat, selectedEdgeColor])

  useEffect(() => {
    parseDocumentText(documentText)
  }, [])

  useEffect(() => {
    // Apply dark mode on component mount if needed
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setDocumentText(value)
      parseDocumentText(value)
    }
  }

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  const toggleDocumentCollapse = () => {
    setIsDocumentCollapsed(!isDocumentCollapsed)
  }

  const handleMaximize = useCallback(() => {
    const elem = document.documentElement
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`)
      })
    } else {
      document.exitFullscreen()
    }
  }, [])

  const handleDownload = useCallback((format: 'png' | 'jpg' | 'svg' | 'gif') => {
    const flowElement = document.querySelector('.react-flow__renderer')
    if (flowElement) {
      const downloadImage = (dataUrl: string, extension: string) => {
        const link = document.createElement('a')
        link.download = `mind-map.${extension}`
        link.href = dataUrl
        link.click()
      }

      const options = {
        backgroundColor: selectedBackgroundColor,
        width: flowElement.scrollWidth,
        height: flowElement.scrollHeight,
        style: {
          '.react-flow__node': {
            color: isDarkMode ? '#ffffff' : '#000000',
          },
          '.react-flow__edge': {
            stroke: selectedEdgeColor,
          },
          '.react-flow__edge.animate-edge-flow': {
            animation: 'flowAnimation 3s linear infinite',
          },
          '@keyframes flowAnimation': {
            from: { strokeDashoffset: 24 },
            to: { strokeDashoffset: 0 },
          },
        },
      }

      const captureImage = async () => {
        // Apply styles to ensure correct colors
        flowElement.querySelectorAll('.react-flow__edge').forEach((edge: HTMLElement) => {
          edge.style.stroke = selectedEdgeColor
        })
        flowElement.querySelectorAll('.react-flow__node').forEach((node: HTMLElement) => {
          node.style.color = isDarkMode ? '#ffffff' : '#000000'
        })

        let dataUrl
        switch (format) {
          case 'png':
            dataUrl = await toPng(flowElement as HTMLElement, options)
            break
          case 'jpg':
            dataUrl = await toJpeg(flowElement as HTMLElement, options)
            break
          case 'svg':
            dataUrl = await toSvg(flowElement as HTMLElement, options)
            break
        }
        return dataUrl
      }

      switch (format) {
        case 'png':
        case 'jpg':
        case 'svg':
          captureImage().then(dataUrl => {
            if (dataUrl) downloadImage(dataUrl, format)
          })
          break
        case 'gif':
          const captureFrames = async () => {
            const frames = []
            for (let i = 0; i < 10; i++) {
              const dataUrl = await captureImage()
              if (dataUrl) frames.push(dataUrl)
              await new Promise(resolve => setTimeout(resolve, 100))
            }
            return frames
          }

          captureFrames().then(frames => {
            createGIF(
              {
                images: frames,
                gifWidth: flowElement.scrollWidth,
                gifHeight: flowElement.scrollHeight,
                interval: 0.1,
              },
              (obj: { error: any; image: string; }) => {
                if (!obj.error) {
                  downloadImage(obj.image, 'gif')
                }
              }
            )
          })
          break
      }
    }
  }, [selectedBackgroundColor, selectedEdgeColor, isDarkMode])

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), [])
  const memoizedEdgeTypes = useMemo(() => ({ animatedSvg: AnimatedSVGEdge }), [])

  // Update nodes when selectedEdgeColor changes
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          selectedEdgeColor,
        },
      }))
    )
  }, [selectedEdgeColor, setNodes])

  const handleEdgeColorChange = (color: string) => {
    setSelectedEdgeColor(color)
    setShowColorPicker(false)
  }

  const handleCustomColorChange = (color: { hex: string }) => {
    setCustomColor(color.hex)
    setSelectedEdgeColor(color.hex)
  }

  const styles = `
    .reactflow-wrapper {
      width: 100%;
      height: 100%;
      cursor: default !important;
    }

    .reactflow-wrapper .react-flow__pane {
      cursor: default !important;
    }

    .reactflow-wrapper .react-flow__node {
      cursor: move !important;
    }

    .reactflow-wrapper .react-flow__handle {
      cursor: crosshair !important;
    }
  `;

  return (
    <div className="h-screen flex">
      <style>{edgeAnimationStyles}</style>
      <style>{styles}</style>
      <div className={`${isDocumentCollapsed ? 'w-12' : 'w-1/3'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300`}>
        {isDocumentCollapsed ? (
          <button
            onClick={toggleDocumentCollapse}
            className="w-full h-12 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title="Expand document editor"
            aria-label="Expand document editor"
          >
            <ChevronRight size={24} />
          </button>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div className="ml-2">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">MindFlow Pro</h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Create Mindmap with fun</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => parseDocumentText(documentText)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    title="Refresh Mind Map"
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Sync
                  </button>
                  <button
                    onClick={toggleDocumentCollapse}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    title="Collapse document editor"
                  >
                    <ChevronLeft size={16} className="mr-2" />
                    Collapse
                  </button>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Workflow className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Professional Mind Mapping
                    </h3>
                    <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                      Use '#' for main topics, '-' for subtopics. Indent with spaces to create hierarchy. Create enterprise-grade mind maps with our advanced editor.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="markdown"
                theme={isDarkMode ? "vs-dark" : "light"}
                value={documentText}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: false },
                  lineNumbers: "on",
                  glyphMargin: true,
                  folding: true,
                  renderLineHighlight: "none",
                  renderIndentGuides: true,
                  renderWhitespace: "none",
                  rulers: [],
                  guides: { bracketPairs: false },
                }}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 dark:text-gray-200"> </span>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Workflow size={16} />
                  <span className="sr-only">Edge Type</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {edgeTypes.map((type) => (
                  <DropdownMenuItem 
                    key={type.value}
                    onClick={() => handleEdgeTypeChange(type.value)}
                  >
                    {type.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Ellipsis size={16} />
                  <span className="sr-only">Edge Format</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {edgeFormats.map((format) => (
                  <DropdownMenuItem 
                    key={format.value}
                    onClick={() => handleEdgeFormatChange(format.value)}
                  >
                    {format.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Palette size={16} />
                  <span className="sr-only">Background Color</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {backgroundColors.map((color) => (
                  <DropdownMenuItem 
                    key={color.value}
                    onClick={() => setSelectedBackgroundColor(color.value)}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-2" 
                        style={{ backgroundColor: color.value }}
                      />
                      {color.label}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <SprayCan size={16} />
                  <span className="sr-only">Edge Color</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {edgeColors.map((color) => (
                  <DropdownMenuItem 
                    key={color.value}
                    onClick={() => {
                      if (color.value === 'custom') {
                        setShowColorPicker(!showColorPicker)
                      } else {
                        handleEdgeColorChange(color.value)
                      }
                    }}
                    onSelect={(event) => {
                      if (color.value === 'custom') {
                        event.preventDefault()
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-2" 
                        style={{ backgroundColor: color.value === 'custom' ? customColor : color.value }}
                      />
                      {color.label}
                    </div>
                  </DropdownMenuItem>
                ))}
                {showColorPicker && (
                  <div className="p-2">
                    <ChromePicker
                      color={customColor}
                      onChange={handleCustomColorChange}
                      disableAlpha
                    />
                    <Button 
                      onClick={() => setShowColorPicker(false)} 
                      className="mt-2 w-full"
                    >
                      Apply Custom Color
                    </Button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Download size={16} />
                  <span className="sr-only">Download</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleDownload('png')}>
                  Download as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('jpg')}>
                  Download as JPG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('svg')}>
                  Download as SVG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDownload('gif')}>
                  Download as GIF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <button 
              onClick={toggleDarkMode} 
              className="p-1 rounded-full bg-gray-200 dark:bg-gray-700"
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>

        <div className="relative flex-1">
          <ReactFlow
            nodes={nodes.filter(node => !node.hidden)}
            edges={edges.filter(edge => !edge.hidden).map(edge => ({
              ...edge,
              style: {
                ...edge.style,
                stroke: (edge.source === hoveredNodeId || edge.target === hoveredNodeId) ? '#3b82f6' : selectedEdgeColor,
              },
              markerEnd: {
                ...edge.markerEnd,
                color: selectedEdgeColor,
              },
            }))}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            edgeTypes={memoizedEdgeTypes}
            connectionLineType={ConnectionLineType.SmoothStep}
            defaultEdgeOptions={{
              type: selectedEdgeType,
              style: { 
                ...flowStyles,
                strokeDasharray: selectedEdgeFormat === 'dotted' ? '5, 5' : 'none',
              },
              animated: selectedEdgeType === 'default',
              className: selectedEdgeType === 'default' ? 'animate-edge-flow' : '',
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: selectedEdgeColor,
              },
            }}
            fitView
            className="reactflow-wrapper bg-white dark:bg-gray-800"
          >
            <Background 
              variant="dots" 
              gap={12} 
              size={1} 
              color={isDarkMode ? '#444' : '#ccc'} 
              style={{ backgroundColor: isDarkMode ? '#1a1a1a' : selectedBackgroundColor }}
            />
            <Controls />
            <MiniMap />
            <div className="absolute top-4 right-4 z-10 flex space-x-2">
              <button
                className="w-10 h-10 flex items-center justify-center p-2 border shadow-none rounded transition-all duration-200 bg-white dark:bg-gray-800 hover:shadow-none hover:border-gray-400"
                onClick={handleMaximize}
                title="Toggle Fullscreen"
                aria-label="Toggle Fullscreen"
              >
                <Maximize2 size={20} />
              </button>
              <button
                className="w-10 h-10 flex items-center justify-center p-2 border shadow-none rounded transition-all duration-200 bg-white dark:bg-gray-800 hover:shadow-none hover:border-gray-400"
                onClick={() => {
                  setNodes([]);
                  setEdges([]);
                }}
                title="Clear Flow"
                aria-label="Clear Flow"
              >
                <Eraser size={20} />
              </button>
            </div>
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}