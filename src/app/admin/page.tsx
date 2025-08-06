// Import UI card components used to build the dashboard cards
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSalesData,getUserData,getProductData } from "./_actions/dashboardData";
// Import the database instance to run queries

// Import helper functions to format currency and numbers for display
import { formatCurrency, formatNumber } from "@/lib/formatters";


// Async function to fetch total sales info from the database

// Main admin dashboard component, runs when admin page is opened
export default async function AdminDashboard() {
  // Fetch sales, user, and product data all at once
  const [salesData, userData, productData] = await Promise.all([
    getSalesData(),     // Get sales data
    getUserData(),      // Get user-related data
    getProductData(),   // Get product-related data
  ]);

  // Return UI layout with three dashboard cards
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Card showing total sales and number of orders */}
      <DashboardCard
        title="Sales"
        subtitle={`${formatNumber(salesData.numberOfSales)} Orders`} // Subtitle = total orders
        body={formatCurrency(salesData.amount)} // Main value = total revenue
      />

      {/* Card showing number of users and average value per user */}
      <DashboardCard
        title="Customers"
        subtitle={`${formatCurrency(userData.averageValuePerUser)} Average Value`} // Avg per user
        body={formatNumber(userData.userCount)} // Total user count
      />

      {/* Card showing active products with inactive count in subtitle */}
      <DashboardCard
        title="Active Products"
        subtitle={`${formatNumber(productData.inactiveCount)} Inactive`} // Inactive products
        body={formatNumber(productData.activeCount)} // Active products
      />
    </div>
  );
}

// Type definition for props used in DashboardCard component
type DashboardCardProps = {
  title: string;    // Main title (e.g. "Sales")
  subtitle: string; // Smaller text below title (e.g. "10 Orders")
  body: string;     // Main value (e.g. "$1,000")
};

// Reusable component to display a single dashboard card
function DashboardCard({ title, subtitle, body }: DashboardCardProps) {
  return (
    <Card> {/* Main card wrapper */}
      <CardHeader> {/* Top section of card */}
        <CardTitle>{title}</CardTitle> {/* Title displayed in large font */}
        <CardDescription>{subtitle}</CardDescription> {/* Subtitle in smaller font */}
      </CardHeader>
      <CardContent> {/* Main content area */}
        <p>{body}</p> {/* Display the key data/value */}
      </CardContent>
    </Card>
  );
}



// export function getUserData(){
//   const {userCount, orderData} = await Promise.all([
//     db.user.count(),
//     db.order.aggregate({
//       _sum: { pricePaidInCents: true},
//     }),
//   ])
//   return {
//     userCount,
//     averageValuePerUser: userCount ===0 ? 0 : (orderData._sum.pricePaidInCents || 0) / userCount / 100
//   }
  // const userCount = await db.user.count()
  // const orderData = await db.order.aggregate({
  //   _sum: { pricePaidInCents: true}
  // })

