import type { SyllabusTopic } from '../types'

export const studyContent: Record<string, SyllabusTopic[]> = {
  COMP2521: [
    {
      id: 'complexity',
      title: 'Algorithm analysis',
      description: 'Understand time complexity and compare algorithm efficiency.',
      outcomes: ['Identify dominant terms in complexity expressions', 'Compare common growth rates', 'Explain best, average and worst cases'],
      lesson: [
        'Big-O notation describes how an algorithm’s resource use grows as the input size n increases. It focuses on the dominant growth term and ignores constant factors.',
        'For example, 3n² + 5n + 8 is O(n²), because the squared term dominates for large n. A single loop is often O(n), while a loop nested inside another loop is often O(n²).',
        'Common growth rates from slower to faster are O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ) and O(n!). Always inspect what the loops actually do before deciding.'
      ],
      questions: [
        { id: 'c1', prompt: 'What is the tightest Big-O classification of 7n² + 4n + 20?', options: ['O(n)', 'O(n²)', 'O(n³)', 'O(2ⁿ)'], answer: 1, explanation: 'The n² term dominates as n grows. Constants and lower-order terms are ignored.' },
        { id: 'c2', prompt: 'A loop visits each of n elements once. What is its time complexity?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 2, explanation: 'The number of iterations grows linearly with n.' },
        { id: 'c3', prompt: 'Two independent nested loops each run n times. What is the total complexity?', options: ['O(n)', 'O(2n)', 'O(n²)', 'O(log n)'], answer: 2, explanation: 'The inner loop runs n times for each of n outer iterations: n × n.' }
      ]
    },
    {
      id: 'linked-lists',
      title: 'Linked lists',
      description: 'Work with nodes, pointers and dynamic list operations.',
      outcomes: ['Trace next pointers', 'Compare arrays and linked lists', 'Reason about insertion and deletion costs'],
      lesson: [
        'A linked list is a sequence of nodes. Each node stores a value and a pointer to the next node. The list usually stores a pointer to its head.',
        'To traverse a list, start at the head and follow next pointers until reaching NULL. Unlike an array, a linked list does not provide constant-time indexing.',
        'Inserting at the head is O(1). Searching for a value or reaching the tail is O(n), unless the data structure maintains an additional tail pointer.'
      ],
      questions: [
        { id: 'l1', prompt: 'What does the next pointer of the final node in a standard singly linked list contain?', options: ['The head pointer', 'NULL', 'The list length', 'A random address'], answer: 1, explanation: 'NULL marks the end of a standard singly linked list.' },
        { id: 'l2', prompt: 'What is the time complexity of inserting a node at the head?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n²)'], answer: 0, explanation: 'Only a constant number of pointer updates are required.' },
        { id: 'l3', prompt: 'Why is accessing the element at index 8 generally O(n) in a linked list?', options: ['Nodes are sorted', 'The list must be traversed from the head', 'The list is stored on disk', 'Pointers are integers'], answer: 1, explanation: 'Linked lists do not support direct indexing; nodes are reached by following pointers.' }
      ]
    },
    {
      id: 'trees',
      title: 'Binary search trees',
      description: 'Explore tree structure, ordering and traversal.',
      outcomes: ['Apply the BST ordering property', 'Trace search operations', 'Recognise traversal orders'],
      lesson: [
        'In a binary search tree, values in the left subtree are smaller than the node and values in the right subtree are larger, assuming distinct keys.',
        'Searching compares the target with the current node and chooses one subtree. A balanced tree can support O(log n) search, while a highly skewed tree can degrade to O(n).',
        'In-order traversal visits left subtree, node, then right subtree. For a BST with distinct keys, this produces values in sorted order.'
      ],
      questions: [
        { id: 't1', prompt: 'What order does an in-order traversal visit?', options: ['Node, left, right', 'Left, node, right', 'Left, right, node', 'Right, node, left'], answer: 1, explanation: 'In-order traversal is left subtree, current node, then right subtree.' },
        { id: 't2', prompt: 'What is the worst-case search complexity of a completely skewed BST?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], answer: 2, explanation: 'A skewed BST behaves like a linked list, potentially requiring a visit to every node.' },
        { id: 't3', prompt: 'For a node with key 10, where should key 6 be inserted?', options: ['In its right subtree', 'In its left subtree', 'At the root always', 'It cannot be inserted'], answer: 1, explanation: 'Keys smaller than a node belong in its left subtree.' }
      ]
    }
  ],
  MATH1081: [
    {
      id: 'logic',
      title: 'Propositional logic',
      description: 'Translate statements and evaluate logical connectives.',
      outcomes: ['Evaluate compound propositions', 'Use truth tables', 'Apply implication and equivalence'],
      lesson: [
        'A proposition is a statement that is either true or false. The connective AND (∧) is true only when both propositions are true; OR (∨) is true when at least one is true.',
        'The implication p → q is false only when p is true and q is false. It is logically equivalent to ¬p ∨ q.',
        'A biconditional p ↔ q is true when p and q have the same truth value.'
      ],
      questions: [
        { id: 'g1', prompt: 'When is p ∧ q true?', options: ['Only when both are true', 'When either is true', 'Only when both are false', 'Whenever p is false'], answer: 0, explanation: 'Conjunction requires both propositions to be true.' },
        { id: 'g2', prompt: 'Which case makes p → q false?', options: ['p false, q false', 'p false, q true', 'p true, q false', 'p true, q true'], answer: 2, explanation: 'An implication is false only when its premise is true and its conclusion is false.' },
        { id: 'g3', prompt: 'What is the negation of p ∧ q?', options: ['¬p ∧ ¬q', '¬p ∨ ¬q', 'p ∨ q', 'p → q'], answer: 1, explanation: 'By De Morgan’s law, ¬(p ∧ q) is equivalent to ¬p ∨ ¬q.' }
      ]
    },
    {
      id: 'counting',
      title: 'Counting principles',
      description: 'Use permutations, combinations and product rules.',
      outcomes: ['Distinguish arrangements from selections', 'Apply factorial notation', 'Choose an appropriate counting method'],
      lesson: [
        'The product rule says that if one choice has m options and a second independent choice has n options, there are m × n combined outcomes.',
        'A permutation counts ordered arrangements. The number of ways to arrange r objects selected from n distinct objects is n!/(n-r)!.',
        'A combination counts selections where order does not matter: C(n,r) = n!/[r!(n-r)!].'
      ],
      questions: [
        { id: 'p1', prompt: 'How many ways can 2 students be selected from 5 if order does not matter?', options: ['10', '20', '25', '5'], answer: 0, explanation: 'Use C(5,2) = 5!/(2!3!) = 10.' },
        { id: 'p2', prompt: 'Which method counts ordered arrangements?', options: ['Combination', 'Permutation', 'Set union', 'Complement only'], answer: 1, explanation: 'Permutations count arrangements where order matters.' },
        { id: 'p3', prompt: 'A code has 3 digits, each independently chosen from 0–9. How many codes are possible?', options: ['30', '100', '300', '1000'], answer: 3, explanation: 'There are 10 choices for each of 3 positions: 10 × 10 × 10 = 1000.' }
      ]
    }
  ],
  SENG2021: [
    {
      id: 'requirements',
      title: 'Requirements engineering',
      description: 'Elicit, specify and validate software requirements.',
      outcomes: ['Distinguish functional and non-functional requirements', 'Write testable requirements', 'Identify stakeholders'],
      lesson: [
        'Functional requirements describe what a system must do, such as allowing a user to submit an invoice.',
        'Non-functional requirements describe qualities or constraints, such as response time, security, availability or accessibility.',
        'A useful requirement is clear, testable, feasible and traceable to a stakeholder need. Avoid vague terms such as “fast” unless they are given measurable criteria.'
      ],
      questions: [
        { id: 'r1', prompt: '“The system shall respond to 95% of searches within 2 seconds” is primarily which type?', options: ['Functional', 'Non-functional', 'User story only', 'Database schema'], answer: 1, explanation: 'It specifies a measurable performance quality.' },
        { id: 'r2', prompt: 'Which is the most testable requirement?', options: ['The app should be nice', 'The app should be easy', 'Users can reset passwords using a verified email link', 'The app should be modern'], answer: 2, explanation: 'It describes a specific behaviour that can be verified.' },
        { id: 'r3', prompt: 'Who is a stakeholder?', options: ['Only the project manager', 'Anyone affected by or able to affect the system', 'Only developers', 'Only paying customers'], answer: 1, explanation: 'Stakeholders include users, customers, developers, operators and other affected parties.' }
      ]
    }
  ]
}
