class Solution {
  public:
    Node *insertAtEnd(Node *head, int x) {
    Node* y = new Node(x);
    if (head == nullptr) {
        return y;
    }
    Node* temp = head;
    while (temp->next != nullptr) {
        temp = temp->next;
    }
    temp->next = y;

    return head;
    }
};
