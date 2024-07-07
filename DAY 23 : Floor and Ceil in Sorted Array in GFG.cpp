pair<int, int> getFloorAndCeil(int arr[], int n, int x) {
    // code here
    int mini= INT_MIN, maxi=INT_MAX;
    for(int i=0;i<n;i++){
        if(arr[i]<=x){
            mini= max(mini,arr[i]);
        }
        if(arr[i]>=x){
            maxi= min(maxi,arr[i]);
        }
        
    }
    
    if(mini==INT_MIN) mini=-1;
    if(maxi==INT_MAX) maxi=-1;
    return {mini,maxi};
}
