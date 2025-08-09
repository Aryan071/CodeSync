import React, { useRef, useEffect, useState } from 'react'
import Editor, { OnMount, OnChange } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { useEditorStore } from '../../store/editorStore'
import { socketService } from '../../services/socket'

interface MonacoEditorProps {
  fileId: string
  content: string
  language: string
  readOnly?: boolean
  onContentChange?: (content: string) => void
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
  fileId,
  content,
  language,
  readOnly = false,
  onContentChange
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof monaco | null>(null)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const { theme, fontSize, wordWrap, minimap, cursors, updateCursor } = useEditorStore()

  // Debounce content changes
  const debounceRef = useRef<NodeJS.Timeout>()

  const handleEditorDidMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor
    monacoRef.current = monacoInstance
    setIsEditorReady(true)

    // Configure editor options
    editor.updateOptions({
      fontSize,
      wordWrap: wordWrap ? 'on' : 'off',
      minimap: { enabled: minimap },
      readOnly,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderLineHighlight: 'all',
      cursorStyle: 'line',
      cursorBlinking: 'blink',
      selectOnLineNumbers: true,
      lineNumbers: 'on',
      glyphMargin: true,
      folding: true,
      links: true,
      colorDecorators: true,
      quickSuggestions: true,
      snippetSuggestions: 'top',
      contextmenu: true,
      mouseWheelZoom: true,
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true
      }
    })

    // Track cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      if (!readOnly) {
        const position = e.position
        const selection = editor.getSelection()
        
        // Update local cursor state
        updateCursor('local', {
          userId: 'local',
          username: 'You',
          position: { line: position.lineNumber, column: position.column },
          selection: selection ? {
            startLine: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLine: selection.endLineNumber,
            endColumn: selection.endColumn
          } : undefined,
          color: '#007acc'
        })

        // Send cursor position to other users
        socketService.updateCursor({
          fileId,
          position: { line: position.lineNumber, column: position.column },
          selection: selection ? {
            startLine: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLine: selection.endLineNumber,
            endColumn: selection.endColumn
          } : undefined
        })
      }
    })

    // Add custom commands
    editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, () => {
      // Save file command
      if (onContentChange && editorRef.current) {
        onContentChange(editorRef.current.getValue())
      }
    })

    // Setup collaborative editing decorations
    setupCollaborativeDecorations()
  }

  const handleEditorChange: OnChange = (value) => {
    if (value !== undefined && onContentChange && !readOnly) {
      // Debounce content changes to avoid too many API calls
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      
      debounceRef.current = setTimeout(() => {
        onContentChange(value)
        
        // Send operation to other users (simplified for now)
        // In a full implementation, this would use proper Operational Transformation
        socketService.updateFile(fileId, value)
      }, 500)
    }
  }

  const setupCollaborativeDecorations = () => {
    if (!editorRef.current || !monacoRef.current) return

    const editor = editorRef.current
    const monacoInstance = monacoRef.current

    // Create decoration types for different users
    const decorationTypes = new Map<string, string>()

    // Function to update cursor decorations
    const updateCursorDecorations = () => {
      const decorations: monaco.editor.IModelDeltaDecoration[] = []

      cursors.forEach((cursor, userId) => {
        if (userId === 'local') return // Skip local cursor

        // Create or get decoration type for this user
        let decorationType = decorationTypes.get(userId)
        if (!decorationType) {
          decorationType = `cursor-${userId}`
          decorationTypes.set(userId, decorationType)

          // Register CSS for this user's cursor
          const style = document.createElement('style')
          style.textContent = `
            .${decorationType} {
              background-color: ${cursor.color}20;
              border-left: 2px solid ${cursor.color};
            }
            .${decorationType}::after {
              content: '${cursor.username}';
              position: absolute;
              top: -20px;
              left: 0;
              background: ${cursor.color};
              color: white;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 11px;
              font-family: 'Inter', sans-serif;
              white-space: nowrap;
              z-index: 1000;
            }
          `
          document.head.appendChild(style)
        }

        // Add cursor decoration
        if (cursor.selection) {
          decorations.push({
            range: new monacoInstance.Range(
              cursor.selection.startLine,
              cursor.selection.startColumn,
              cursor.selection.endLine,
              cursor.selection.endColumn
            ),
            options: {
              className: decorationType,
              hoverMessage: { value: `${cursor.username} is here` }
            }
          })
        } else {
          decorations.push({
            range: new monacoInstance.Range(
              cursor.position.line,
              cursor.position.column,
              cursor.position.line,
              cursor.position.column + 1
            ),
            options: {
              className: decorationType,
              hoverMessage: { value: `${cursor.username} is here` }
            }
          })
        }
      })

      editor.deltaDecorations([], decorations)
    }

    // Update decorations when cursors change
    updateCursorDecorations()
  }

  // Update editor options when store values change
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize,
        wordWrap: wordWrap ? 'on' : 'off',
        minimap: { enabled: minimap }
      })
    }
  }, [fontSize, wordWrap, minimap])

  // Update collaborative decorations when cursors change
  useEffect(() => {
    if (isEditorReady) {
      setupCollaborativeDecorations()
    }
  }, [cursors, isEditorReady])

  // Update content when it changes externally
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== content) {
      const model = editorRef.current.getModel()
      if (model) {
        // Preserve cursor position when updating content
        const position = editorRef.current.getPosition()
        model.setValue(content)
        if (position) {
          editorRef.current.setPosition(position)
        }
      }
    }
  }, [content])

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={language}
        value={content}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        onMount={handleEditorDidMount}
        onChange={handleEditorChange}
        options={{
          readOnly,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          minimap: { enabled: minimap },
          fontSize,
          wordWrap: wordWrap ? 'on' : 'off',
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          selectOnLineNumbers: true,
          matchBrackets: 'always',
          autoClosingBrackets: 'always',
          autoClosingQuotes: 'always',
          autoIndent: 'full',
          formatOnPaste: true,
          formatOnType: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnEnter: 'on',
          tabCompletion: 'on',
          parameterHints: { enabled: true },
          quickSuggestions: {
            other: true,
            comments: true,
            strings: true
          }
        }}
        loading={
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500 dark:text-gray-400">Loading editor...</div>
          </div>
        }
      />
    </div>
  )
}

export default MonacoEditor
