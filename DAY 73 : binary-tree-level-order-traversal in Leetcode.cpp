class Solution {
    public List<List<Integer>> levelOrder(TreeNode root) {

        if (root == null) {
            return new ArrayList<>(); 
        }

        Queue<TreeNode> queue = new ArrayDeque<TreeNode>();
        List<List<Integer>> traversal = new ArrayList<>();

        queue.add(root); 

        while (!queue.isEmpty()) {
            List<Integer> currLevel = new ArrayList<>();
            int currSize = queue.size();  

      
            for (int i = 0; i < currSize; i++) {
                TreeNode currNode = queue.poll(); 

                currLevel.add(currNode.val);

                if (currNode.left != null) {
                    queue.add(currNode.left);
                }
                if (currNode.right != null) {
                    queue.add(currNode.right);
                }
            }
            traversal.add(currLevel);
        }

        return traversal;
    }
}
