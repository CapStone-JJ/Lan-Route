const express = require("express");
const notificationsRouter = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { authenticateUser } = require("../auth/middleware");

// fetch notifications for the currently authenticated user
notificationsRouter.get("/", authenticateUser, async (req, res) => {
  const userId = req.user.id;
  const notifications = await prisma.notification.findMany({
    where: {
      recipientId: userId,
    },
    include: {
      triggerBy: true, // This should include the related user details
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  res.json(notifications);
});

// mark notifications as read
notificationsRouter.put("/:id/read", authenticateUser, async (req, res) => {
  const notificationId = parseInt(req.params.id);
  const updatedNotification = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
  res.json(updatedNotification);
});

// Mark all notifications as read for the currently authenticated user
notificationsRouter.put(
  "/markAllAsRead",
  authenticateUser,
  async (req, res) => {
    const userId = req.user.id;

    try {
      // Update all notifications for the user, setting them to read
      const updatedNotifications = await prisma.notification.updateMany({
        where: {
          recipientId: userId,
          read: false, // Only update unread notifications
        },
        data: {
          read: true,
        },
      });

      res.json({
        message: "All notifications marked as read",
        count: updatedNotifications.count,
      });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  }
);

// Assuming `notificationsRouter` is your Express router for notification-related routes
notificationsRouter.delete(
  "/:notificationId",
  authenticateUser,
  async (req, res) => {
    const { notificationId } = req.params;
    const userId = req.user.id; // Assuming you have middleware to set `req.user` to the authenticated user

    try {
      const notification = await prisma.notification.findUnique({
        where: { id: parseInt(notificationId) },
      });

      if (!notification) {
        return res.status(404).json({ error: "Not found." });
      }

      if (notification.recipientId !== userId) {
        return res
          .status(403)
          .json({ error: "You can only delete your own notifications" });
      }

      await prisma.notification.delete({
        where: { id: parseInt(notificationId) },
      });

      res.status(200).json({ message: "Notification deleted successfully." });
    } catch (error) {
      console.error("Failed to delete notification:", error);
      res.status(500).send("Internal server error");
    }
  }
);

module.exports = notificationsRouter;
