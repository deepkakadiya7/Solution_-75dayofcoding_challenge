class Solution {
public:
    ListNode* deleteMiddle(ListNode* head) {
        ListNode* slow = head;
        if (head == nullptr || head->next == nullptr) {
           
            return nullptr;
        }
        ListNode* fast = head;

        fast= head->next->next;
        while(fast != nullptr && fast -> next != nullptr){
            slow=slow->next;
            fast=fast->next->next;

        }
        slow->next=slow->next->next;
        return head;
    }
};
