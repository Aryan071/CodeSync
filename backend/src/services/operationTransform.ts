/**
 * Operational Transformation Engine for CodeSync
 * 
 * This implements a sophisticated OT system that handles concurrent editing
 * by transforming operations to maintain consistency across all clients.
 */

export interface Operation {
  id: string
  type: 'retain' | 'insert' | 'delete'
  length?: number
  content?: string
  author: string
  timestamp: number
  fileId: string
}

export interface TextOperation {
  ops: Array<{
    type: 'retain' | 'insert' | 'delete'
    length?: number
    content?: string
  }>
}

/**
 * Core Operational Transformation class
 */
export class OperationTransform {
  /**
   * Transform an operation against another operation
   * This is the core of OT - handling concurrent operations
   */
  static transform(op1: Operation, op2: Operation, priority: boolean = false): Operation {
    // If operations are on different files, no transformation needed
    if (op1.fileId !== op2.fileId) {
      return op1
    }

    // Convert simple operations to TextOperation format for easier processing
    const textOp1 = this.operationToTextOp(op1)
    const textOp2 = this.operationToTextOp(op2)

    // Transform the operations
    const transformed = this.transformTextOperations(textOp1, textOp2, priority)

    // Convert back to Operation format
    return this.textOpToOperation(transformed, op1)
  }

  /**
   * Transform two text operations against each other
   */
  static transformTextOperations(
    op1: TextOperation, 
    op2: TextOperation, 
    priority: boolean
  ): TextOperation {
    const ops1 = [...op1.ops]
    const ops2 = [...op2.ops]
    const result: TextOperation = { ops: [] }

    let i = 0, j = 0
    let offset1 = 0, offset2 = 0

    while (i < ops1.length || j < ops2.length) {
      const operation1 = ops1[i]
      const operation2 = ops2[j]

      // If we've exhausted one operation, add the rest of the other
      if (!operation1) {
        result.ops.push(operation2)
        j++
        continue
      }

      if (!operation2) {
        result.ops.push(operation1)
        i++
        continue
      }

      // Handle different operation type combinations
      if (operation1.type === 'retain' && operation2.type === 'retain') {
        // Both retain: take the minimum and advance both
        const minLength = Math.min(operation1.length!, operation2.length!)
        result.ops.push({ type: 'retain', length: minLength })

        operation1.length! -= minLength
        operation2.length! -= minLength

        if (operation1.length === 0) i++
        if (operation2.length === 0) j++

      } else if (operation1.type === 'insert' && operation2.type === 'insert') {
        // Both insert: use priority to determine order
        if (priority) {
          result.ops.push(operation1)
          i++
        } else {
          // Need to retain the length of op2's insert before applying op1
          result.ops.push({ type: 'retain', length: operation2.content!.length })
          result.ops.push(operation1)
          i++
          j++ // Skip op2 since we handled it
        }

      } else if (operation1.type === 'insert' && operation2.type === 'retain') {
        // Op1 inserts, op2 retains: insert takes precedence
        result.ops.push(operation1)
        i++

      } else if (operation1.type === 'insert' && operation2.type === 'delete') {
        // Op1 inserts, op2 deletes: insert takes precedence
        result.ops.push(operation1)
        i++

      } else if (operation1.type === 'retain' && operation2.type === 'insert') {
        // Op1 retains, op2 inserts: need to retain the inserted content
        result.ops.push({ type: 'retain', length: operation2.content!.length })
        j++

      } else if (operation1.type === 'retain' && operation2.type === 'delete') {
        // Op1 retains, op2 deletes: advance past the deleted content
        const deleteLength = operation2.length!
        const retainLength = operation1.length!

        if (retainLength <= deleteLength) {
          // Retain is completely within delete - skip retain
          operation2.length! -= retainLength
          i++
          if (operation2.length === 0) j++
        } else {
          // Retain extends past delete
          operation1.length! -= deleteLength
          j++
        }

      } else if (operation1.type === 'delete' && operation2.type === 'retain') {
        // Op1 deletes, op2 retains: delete takes precedence
        const deleteLength = operation1.length!
        const retainLength = operation2.length!

        if (deleteLength <= retainLength) {
          result.ops.push(operation1)
          operation2.length! -= deleteLength
          i++
          if (operation2.length === 0) j++
        } else {
          result.ops.push({ type: 'delete', length: retainLength })
          operation1.length! -= retainLength
          j++
        }

      } else if (operation1.type === 'delete' && operation2.type === 'insert') {
        // Op1 deletes, op2 inserts: need to retain the insert
        result.ops.push({ type: 'retain', length: operation2.content!.length })
        j++

      } else if (operation1.type === 'delete' && operation2.type === 'delete') {
        // Both delete: combine the deletes
        const minLength = Math.min(operation1.length!, operation2.length!)
        
        operation1.length! -= minLength
        operation2.length! -= minLength

        if (operation1.length === 0) i++
        if (operation2.length === 0) j++
      }
    }

    return this.compactTextOperation(result)
  }

  /**
   * Apply an operation to a text string
   */
  static applyOperation(text: string, operation: Operation): string {
    const textOp = this.operationToTextOp(operation)
    return this.applyTextOperation(text, textOp)
  }

  /**
   * Apply a text operation to a string
   */
  static applyTextOperation(text: string, operation: TextOperation): string {
    let result = ''
    let index = 0

    for (const op of operation.ops) {
      switch (op.type) {
        case 'retain':
          result += text.substring(index, index + op.length!)
          index += op.length!
          break
        case 'insert':
          result += op.content!
          break
        case 'delete':
          index += op.length!
          break
      }
    }

    return result
  }

  /**
   * Convert a simple Operation to TextOperation format
   */
  private static operationToTextOp(op: Operation): TextOperation {
    const ops: Array<{ type: 'retain' | 'insert' | 'delete'; length?: number; content?: string }> = []

    switch (op.type) {
      case 'insert':
        ops.push({ type: 'insert', content: op.content! })
        break
      case 'delete':
        ops.push({ type: 'delete', length: op.length! })
        break
      case 'retain':
        ops.push({ type: 'retain', length: op.length! })
        break
    }

    return { ops }
  }

  /**
   * Convert TextOperation back to simple Operation format
   */
  private static textOpToOperation(textOp: TextOperation, originalOp: Operation): Operation {
    // For simplicity, return the first operation in the TextOperation
    // In a more complex system, you might need to handle composite operations
    const firstOp = textOp.ops[0]
    
    return {
      ...originalOp,
      type: firstOp.type,
      content: firstOp.content,
      length: firstOp.length
    }
  }

  /**
   * Compact a text operation by merging consecutive operations of the same type
   */
  private static compactTextOperation(textOp: TextOperation): TextOperation {
    const compacted: TextOperation = { ops: [] }
    
    for (const op of textOp.ops) {
      const lastOp = compacted.ops[compacted.ops.length - 1]
      
      if (lastOp && lastOp.type === op.type) {
        if (op.type === 'retain' || op.type === 'delete') {
          lastOp.length = (lastOp.length || 0) + (op.length || 0)
        } else if (op.type === 'insert') {
          lastOp.content = (lastOp.content || '') + (op.content || '')
        }
      } else {
        compacted.ops.push({ ...op })
      }
    }
    
    return compacted
  }

  /**
   * Compose two operations into a single operation
   * This is used when applying multiple operations in sequence
   */
  static compose(op1: Operation, op2: Operation): Operation {
    if (op1.fileId !== op2.fileId) {
      throw new Error('Cannot compose operations on different files')
    }

    const textOp1 = this.operationToTextOp(op1)
    const textOp2 = this.operationToTextOp(op2)
    
    const composed = this.composeTextOperations(textOp1, textOp2)
    
    return this.textOpToOperation(composed, {
      ...op1,
      id: op2.id, // Use the newer operation's ID
      timestamp: op2.timestamp
    })
  }

  /**
   * Compose two text operations
   */
  private static composeTextOperations(op1: TextOperation, op2: TextOperation): TextOperation {
    const ops1 = [...op1.ops]
    const ops2 = [...op2.ops]
    const result: TextOperation = { ops: [] }

    let i = 0, j = 0

    while (i < ops1.length || j < ops2.length) {
      const operation1 = ops1[i]
      const operation2 = ops2[j]

      if (!operation1) {
        result.ops.push(operation2)
        j++
        continue
      }

      if (!operation2) {
        result.ops.push(operation1)
        i++
        continue
      }

      // Compose the operations based on their types
      if (operation1.type === 'retain' && operation2.type === 'retain') {
        const minLength = Math.min(operation1.length!, operation2.length!)
        result.ops.push({ type: 'retain', length: minLength })

        operation1.length! -= minLength
        operation2.length! -= minLength

        if (operation1.length === 0) i++
        if (operation2.length === 0) j++

      } else if (operation1.type === 'insert' && operation2.type === 'retain') {
        result.ops.push(operation1)
        operation2.length! -= operation1.content!.length
        i++
        if (operation2.length === 0) j++

      } else if (operation1.type === 'insert' && operation2.type === 'delete') {
        // Insert then delete - they cancel out partially
        const insertLength = operation1.content!.length
        const deleteLength = operation2.length!

        if (insertLength <= deleteLength) {
          operation2.length! -= insertLength
          i++
          if (operation2.length === 0) j++
        } else {
          result.ops.push({ type: 'insert', content: operation1.content!.substring(deleteLength) })
          i++
          j++
        }

      } else {
        // Handle other combinations
        result.ops.push(operation1)
        i++
      }
    }

    return this.compactTextOperation(result)
  }

  /**
   * Check if an operation is valid
   */
  static isValidOperation(op: Operation): boolean {
    if (!op.id || !op.author || !op.fileId || !op.timestamp) {
      return false
    }

    switch (op.type) {
      case 'insert':
        return typeof op.content === 'string' && op.content.length > 0
      case 'delete':
        return typeof op.length === 'number' && op.length > 0
      case 'retain':
        return typeof op.length === 'number' && op.length > 0
      default:
        return false
    }
  }

  /**
   * Generate operation ID
   */
  static generateOperationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Operation History Manager
 * Keeps track of operations for conflict resolution and undo/redo
 */
export class OperationHistory {
  private operations: Map<string, Operation[]> = new Map()
  private maxHistorySize = 1000

  addOperation(fileId: string, operation: Operation): void {
    if (!this.operations.has(fileId)) {
      this.operations.set(fileId, [])
    }

    const history = this.operations.get(fileId)!
    history.push(operation)

    // Trim history if it gets too large
    if (history.length > this.maxHistorySize) {
      history.splice(0, history.length - this.maxHistorySize)
    }
  }

  getOperations(fileId: string, since?: number): Operation[] {
    const history = this.operations.get(fileId) || []
    
    if (since) {
      return history.filter(op => op.timestamp > since)
    }
    
    return [...history]
  }

  getLastOperation(fileId: string): Operation | null {
    const history = this.operations.get(fileId) || []
    return history.length > 0 ? history[history.length - 1] : null
  }

  clear(fileId: string): void {
    this.operations.delete(fileId)
  }

  clearAll(): void {
    this.operations.clear()
  }
}

/**
 * Conflict Resolution Manager
 * Handles transforming operations when conflicts occur
 */
export class ConflictResolver {
  private history = new OperationHistory()

  /**
   * Resolve conflicts for a new operation against existing operations
   */
  resolveConflicts(
    newOperation: Operation, 
    existingOperations: Operation[]
  ): Operation {
    let transformedOp = newOperation

    // Transform against all concurrent operations
    for (const existingOp of existingOperations) {
      if (existingOp.timestamp <= newOperation.timestamp && 
          existingOp.author !== newOperation.author) {
        // Use author comparison for tie-breaking priority
        const priority = newOperation.author > existingOp.author
        transformedOp = OperationTransform.transform(transformedOp, existingOp, priority)
      }
    }

    return transformedOp
  }

  /**
   * Add operation to history
   */
  addOperation(operation: Operation): void {
    this.history.addOperation(operation.fileId, operation)
  }

  /**
   * Get operations since a timestamp
   */
  getOperationsSince(fileId: string, timestamp: number): Operation[] {
    return this.history.getOperations(fileId, timestamp)
  }
}
