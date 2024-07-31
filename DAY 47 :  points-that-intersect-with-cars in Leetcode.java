class Solution {
    public int numberOfPoints(List<List<Integer>> nums) {

    List<Integer> l=new ArrayList<>();
    for(int i=0;i<nums.size();i++)
    {
        int a=nums.get(i).get(0);
        int b=nums.get(i).get(1);
        for(int j=a;j<=b;j++)
        {
            if(!(l.contains(j)))
            l.add(j);
        }
    }    
    return l.size();
    }
}
