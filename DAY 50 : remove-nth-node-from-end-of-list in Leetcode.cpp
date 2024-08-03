class Solution {
public:
    ListNode* removeNthFromEnd(ListNode* head, int n) {
        int listSize = 0;
        int indxToRemove = 0;
        ListNode* current = head;
        while(current != nullptr)
        {
            listSize ++;
            current = current -> next;
        }
        if(listSize == 1 || n >= listSize)
        {
            head = head -> next;
            return head;
        }
        indxToRemove = listSize - n;
        current = head;
        
        for(int i = 0 ; i < indxToRemove - 1 ; i ++)
        {
            current = current -> next;
        }
        current-> next = current -> next -> next;
        return head;
        
    }
};
