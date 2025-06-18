<?php
session_start();
include 'db.php';

if (!isset($_SESSION['user_id'])) {
    echo "You must be logged in to post an item.";
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = trim($_POST['title']);
    $description = trim($_POST['description']);
    $category = $_POST['category'];
    $price = trim($_POST['price']);
    $user_id = $_SESSION['user_id'];

    // For now, we use a placeholder image
    $image_path = "assets/images/placeholder.png";

    $stmt = $conn->prepare("INSERT INTO items (user_id, title, description, category, price, image_path) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isssss", $user_id, $title, $description, $category, $price, $image_path);

    if ($stmt->execute()) {
        echo "Item posted successfully. <a href='../index.php'>Return home</a>.";
    } else {
        echo "Error posting item.";
    }

    $stmt->close();
    $conn->close();
}
?>
