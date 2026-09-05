const fs = require("fs");

const filePath = "/Users/dipeshchaudhary/Downloads/Shuvmarg/shuvmarg_busowner_web/src/components/operator-dashboard/NotificationDropdown.tsx";
let code = fs.readFileSync(filePath, "utf-8");

// Add authFetch import
if (!code.includes('import { authFetch } from "@/lib/auth"')) {
    code = code.replace(
        'import {',
        'import { authFetch } from "@/lib/auth";\nimport {'
    );
}

// Remove mockNotifications and replace with helper functions
code = code.replace(/const mockNotifications: OperatorNotification\[\] = \[\s*\{[\s\S]*?\];/m, `
function mapBackendTypeToCategory(type: string): "Booking" | "Fleet" | "Payment" | "Refund" | "System" {
  if (!type) return "System";
  if (type.includes("BOOKING") || type.includes("TICKET")) return "Booking";
  if (type.includes("PAYMENT") || type.includes("DISPUTE")) return "Payment";
  if (type.includes("FLEET")) return "Fleet";
  if (type.includes("REFUND")) return "Refund";
  return "System";
}

function mapBackendTypeToPriority(type: string): "Critical" | "High" | "Normal" {
  if (!type) return "Normal";
  if (type.includes("DISPUTE") || type.includes("CANCELLED")) return "High";
  return "Normal";
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return \`\${diffInSeconds}s ago\`;
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return \`\${diffInMinutes}m ago\`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return \`\${diffInHours}h ago\`;
  const diffInDays = Math.floor(diffInHours / 24);
  return \`\${diffInDays}d ago\`;
}
`);

code = code.replace(/const \[notifications, setNotifications\] = useState<OperatorNotification\[\]>\(mockNotifications\);/m, `const [notifications, setNotifications] = useState<OperatorNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await authFetch("/pushnoti/my-local-notifications");
      if (res.ok) {
        const data = await res.json();
        if (data.status && Array.isArray(data.notifications)) {
          const mapped = data.notifications.map((n: any) => ({
            id: n._id,
            title: n.title,
            message: n.message,
            time: timeAgo(n.createdAt),
            read: n.isRead,
            category: mapBackendTypeToCategory(n.type),
            priority: mapBackendTypeToPriority(n.type),
          }));
          setNotifications(mapped);
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);`);

code = code.replace(/const markAllAsRead = \(\) => \{[\s\S]*?\};/m, `const markAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    // Send background requests to mark all as read
    try {
      await Promise.all(
        unreadIds.map((id) =>
          authFetch(\`/pushnoti/markNotificationAsRead/\${id}\`, { method: "PATCH" })
        )
      );
    } catch (err) {
      console.error("Failed to mark some notifications as read", err);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    try {
      await authFetch(\`/pushnoti/markNotificationAsRead/\${notificationId}\`, { method: "PATCH" });
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };`);

code = code.replace(/onClick=\{\(\) => \{\s*setNotifications\(\(prev\) =>\s*prev\.map\(\(n\) =>\s*n\.id === notification\.id \? \{ \.\.\.n, read: true \} : n\s*\)\s*\);\s*\}\}/m, `onClick={() => handleMarkAsRead(notification.id)}`);

fs.writeFileSync(filePath, code);
