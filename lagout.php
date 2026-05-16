<?php
session_start();
session_destroy();
header("Location: lagin.html");
exit;
?>
