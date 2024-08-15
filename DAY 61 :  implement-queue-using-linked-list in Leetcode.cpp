void MyQueue:: push(int x)
{
        // Your Code
        QueueNode *node = new QueueNode(x);
    
    if(!rear){
        rear = front = node;
        return;
    }
    
    rear->next = node;
    rear = node;
}

//Function to pop front element from the queue.
int MyQueue :: pop()
{
    if (!front) return -1;

    int temp = front->data;
    QueueNode *todel = front;
    front = front->next;
    if (!front) rear = nullptr; 
    delete todel; 
    return temp;
}
