vector<vector<int>> getTreeTraversal(TreeNode *root) {
    vector<vector<int>> result(3);  // 2D vector to store the traversals: inorder, preorder, postorder

    // Helper function for inorder traversal
    function<void(TreeNode*)> inorderTraversal = [&](TreeNode* node) {
        if (node == nullptr) return;
        inorderTraversal(node->left);
        result[0].push_back(node->data);
        inorderTraversal(node->right);
    };

    // Helper function for preorder traversal
    function<void(TreeNode*)> preorderTraversal = [&](TreeNode* node) {
        if (node == nullptr) return;
        result[1].push_back(node->data);
        preorderTraversal(node->left);
        preorderTraversal(node->right);
    };

    // Helper function for postorder traversal
    function<void(TreeNode*)> postorderTraversal = [&](TreeNode* node) {
        if (node == nullptr) return;
        postorderTraversal(node->left);
        postorderTraversal(node->right);
        result[2].push_back(node->data);
    };

    // Perform the traversals
    inorderTraversal(root);
    preorderTraversal(root);
    postorderTraversal(root);

    return result;
}
