import { OperationTransform, Operation, ConflictResolver } from '../operationTransform'

describe('OperationTransform', () => {
  describe('Basic Operations', () => {
    it('should apply insert operation correctly', () => {
      const text = 'Hello World'
      const operation: Operation = {
        id: 'op1',
        type: 'insert',
        content: ' Beautiful',
        author: 'user1',
        timestamp: Date.now(),
        fileId: 'file1'
      }

      const result = OperationTransform.applyOperation(text, operation)
      expect(result).toBe(' BeautifulHello World')
    })

    it('should apply delete operation correctly', () => {
      const text = 'Hello World'
      const operation: Operation = {
        id: 'op1',
        type: 'delete',
        length: 6,
        author: 'user1',
        timestamp: Date.now(),
        fileId: 'file1'
      }

      const result = OperationTransform.applyOperation(text, operation)
      expect(result).toBe('World')
    })

    it('should apply retain operation correctly', () => {
      const text = 'Hello World'
      const operation: Operation = {
        id: 'op1',
        type: 'retain',
        length: 5,
        author: 'user1',
        timestamp: Date.now(),
        fileId: 'file1'
      }

      const result = OperationTransform.applyOperation(text, operation)
      expect(result).toBe('Hello')
    })
  })

  describe('Operation Validation', () => {
    it('should validate insert operation', () => {
      const validInsert: Operation = {
        id: 'op1',
        type: 'insert',
        content: 'Hello',
        author: 'user1',
        timestamp: Date.now(),
        fileId: 'file1'
      }

      expect(OperationTransform.isValidOperation(validInsert)).toBe(true)
    })

    it('should validate delete operation', () => {
      const validDelete: Operation = {
        id: 'op1',
        type: 'delete',
        length: 5,
        author: 'user1',
        timestamp: Date.now(),
        fileId: 'file1'
      }

      expect(OperationTransform.isValidOperation(validDelete)).toBe(true)
    })

    it('should reject operation without required fields', () => {
      const invalidOperation: Partial<Operation> = {
        type: 'insert',
        content: 'Hello'
        // missing id, author, timestamp, fileId
      }

      expect(OperationTransform.isValidOperation(invalidOperation as Operation)).toBe(false)
    })

    it('should reject insert operation without content', () => {
      const invalidInsert: Operation = {
        id: 'op1',
        type: 'insert',
        // content is missing
        author: 'user1',
        timestamp: Date.now(),
        fileId: 'file1'
      } as any

      expect(OperationTransform.isValidOperation(invalidInsert)).toBe(false)
    })

    it('should reject delete operation without length', () => {
      const invalidDelete: Operation = {
        id: 'op1',
        type: 'delete',
        // length is missing
        author: 'user1',
        timestamp: Date.now(),
        fileId: 'file1'
      } as any

      expect(OperationTransform.isValidOperation(invalidDelete)).toBe(false)
    })
  })

  describe('Operation Transformation', () => {
    it('should transform concurrent insert operations', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'insert',
        content: 'A',
        author: 'user1',
        timestamp: 1000,
        fileId: 'file1'
      }

      const op2: Operation = {
        id: 'op2',
        type: 'insert',
        content: 'B',
        author: 'user2',
        timestamp: 1001,
        fileId: 'file1'
      }

      const transformed = OperationTransform.transform(op1, op2, true)
      
      expect(transformed.type).toBe('insert')
      expect(transformed.content).toBe('A')
      expect(transformed.author).toBe('user1')
    })

    it('should not transform operations on different files', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'insert',
        content: 'A',
        author: 'user1',
        timestamp: 1000,
        fileId: 'file1'
      }

      const op2: Operation = {
        id: 'op2',
        type: 'insert',
        content: 'B',
        author: 'user2',
        timestamp: 1001,
        fileId: 'file2' // different file
      }

      const transformed = OperationTransform.transform(op1, op2)
      
      // Should return original operation unchanged
      expect(transformed).toEqual(op1)
    })

    it('should handle insert vs delete transformation', () => {
      const insertOp: Operation = {
        id: 'op1',
        type: 'insert',
        content: 'Hello',
        author: 'user1',
        timestamp: 1000,
        fileId: 'file1'
      }

      const deleteOp: Operation = {
        id: 'op2',
        type: 'delete',
        length: 3,
        author: 'user2',
        timestamp: 1001,
        fileId: 'file1'
      }

      const transformed = OperationTransform.transform(insertOp, deleteOp)
      
      expect(transformed.type).toBe('insert')
      expect(transformed.content).toBe('Hello')
    })
  })

  describe('Operation Composition', () => {
    it('should compose two operations on the same file', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'insert',
        content: 'Hello',
        author: 'user1',
        timestamp: 1000,
        fileId: 'file1'
      }

      const op2: Operation = {
        id: 'op2',
        type: 'insert',
        content: ' World',
        author: 'user1',
        timestamp: 1001,
        fileId: 'file1'
      }

      const composed = OperationTransform.compose(op1, op2)
      
      expect(composed.fileId).toBe('file1')
      expect(composed.author).toBe('user1')
      expect(composed.id).toBe('op2') // Uses newer operation's ID
    })

    it('should reject composition of operations on different files', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'insert',
        content: 'Hello',
        author: 'user1',
        timestamp: 1000,
        fileId: 'file1'
      }

      const op2: Operation = {
        id: 'op2',
        type: 'insert',
        content: ' World',
        author: 'user1',
        timestamp: 1001,
        fileId: 'file2' // different file
      }

      expect(() => OperationTransform.compose(op1, op2)).toThrow('Cannot compose operations on different files')
    })
  })

  describe('Complex Scenarios', () => {
    it('should handle sequence of operations correctly', () => {
      let text = 'Hello'
      
      // User 1 inserts at position 5
      const op1: Operation = {
        id: 'op1',
        type: 'insert',
        content: ' World',
        author: 'user1',
        timestamp: 1000,
        fileId: 'file1'
      }
      
      text = OperationTransform.applyOperation(text, op1)
      expect(text).toBe(' WorldHello')
      
      // User 2 deletes first 6 characters
      const op2: Operation = {
        id: 'op2',
        type: 'delete',
        length: 6,
        author: 'user2',
        timestamp: 1001,
        fileId: 'file1'
      }
      
      text = OperationTransform.applyOperation(text, op2)
      expect(text).toBe('Hello')
    })

    it('should maintain consistency with concurrent operations', () => {
      const initialText = 'Hello'
      
      // Two users insert at the same position
      const op1: Operation = {
        id: 'op1',
        type: 'insert',
        content: ' Beautiful',
        author: 'user1',
        timestamp: 1000,
        fileId: 'file1'
      }
      
      const op2: Operation = {
        id: 'op2',
        type: 'insert',
        content: ' Amazing',
        author: 'user2',
        timestamp: 1000, // same timestamp
        fileId: 'file1'
      }
      
      // Transform operations
      const transformedOp1 = OperationTransform.transform(op1, op2, true)
      const transformedOp2 = OperationTransform.transform(op2, op1, false)
      
      // Apply in different orders and verify consistency
      let text1 = initialText
      text1 = OperationTransform.applyOperation(text1, transformedOp1)
      text1 = OperationTransform.applyOperation(text1, transformedOp2)
      
      let text2 = initialText
      text2 = OperationTransform.applyOperation(text2, transformedOp2)
      text2 = OperationTransform.applyOperation(text2, transformedOp1)
      
      // Both should result in the same final text
      expect(text1).toBe(text2)
    })
  })

  describe('ConflictResolver', () => {
    let resolver: ConflictResolver

    beforeEach(() => {
      resolver = new ConflictResolver()
    })

    it('should resolve conflicts between operations', () => {
      const existingOp: Operation = {
        id: 'op1',
        type: 'insert',
        content: 'A',
        author: 'user1',
        timestamp: 1000,
        fileId: 'file1'
      }

      const newOp: Operation = {
        id: 'op2',
        type: 'insert',
        content: 'B',
        author: 'user2',
        timestamp: 1001,
        fileId: 'file1'
      }

      resolver.addOperation(existingOp)
      
      const resolved = resolver.resolveConflicts(newOp, [existingOp])
      
      expect(resolved.type).toBe('insert')
      expect(resolved.author).toBe('user2')
    })

    it('should track operation history', () => {
      const operation: Operation = {
        id: 'op1',
        type: 'insert',
        content: 'Hello',
        author: 'user1',
        timestamp: 1000,
        fileId: 'file1'
      }

      resolver.addOperation(operation)
      
      const history = resolver.getOperationsSince('file1', 0)
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual(operation)
    })

    it('should filter operations by timestamp', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'insert',
        content: 'A',
        author: 'user1',
        timestamp: 1000,
        fileId: 'file1'
      }

      const op2: Operation = {
        id: 'op2',
        type: 'insert',
        content: 'B',
        author: 'user2',
        timestamp: 2000,
        fileId: 'file1'
      }

      resolver.addOperation(op1)
      resolver.addOperation(op2)
      
      const recentOps = resolver.getOperationsSince('file1', 1500)
      expect(recentOps).toHaveLength(1)
      expect(recentOps[0].id).toBe('op2')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty text operations', () => {
      const text = ''
      const operation: Operation = {
        id: 'op1',
        type: 'insert',
        content: 'Hello',
        author: 'user1',
        timestamp: Date.now(),
        fileId: 'file1'
      }

      const result = OperationTransform.applyOperation(text, operation)
      expect(result).toBe('Hello')
    })

    it('should handle delete operation beyond text length', () => {
      const text = 'Hi'
      const operation: Operation = {
        id: 'op1',
        type: 'delete',
        length: 10, // longer than text
        author: 'user1',
        timestamp: Date.now(),
        fileId: 'file1'
      }

      const result = OperationTransform.applyOperation(text, operation)
      expect(result).toBe('') // Should delete all available text
    })

    it('should generate unique operation IDs', () => {
      const id1 = OperationTransform.generateOperationId()
      const id2 = OperationTransform.generateOperationId()
      
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(typeof id2).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
      expect(id2.length).toBeGreaterThan(0)
    })
  })
})
