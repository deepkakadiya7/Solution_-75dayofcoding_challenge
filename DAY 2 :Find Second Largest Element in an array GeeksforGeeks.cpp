class Solution{
public:	
	// Function returns the second
	// largest elements
	int print2largest(int arr[], int n) {
	     if(n<2){
            return -1;
        }
        
        int i,largest=arr[0];
        int slargest=-1;
         for (i=0; i<n; i++)
         {
             if(arr[i]>largest)
             largest=arr[i];
         
         }
          
         for(i=0; i<n; i++)
         {
             if(arr[i]>slargest && arr[i]!=largest)
             slargest=arr[i];
         
         }
         return slargest;
	}
};
