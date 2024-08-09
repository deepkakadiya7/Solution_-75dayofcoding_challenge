void MyQueue :: push(int x)
{
        
        arr[rear]=x;
        rear++;
}


int MyQueue :: pop()
{
    if(front >= rear){
        return -1;
    }
    int popped = arr[front];
    front++;
    return popped;
    
}
