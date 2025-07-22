export const dynamic = "force-dynamic";

import db from "../../db/db";
import { currentUser } from "@clerk/nextjs/server";
import { ClientHeader } from "@/components/Layout/ClientHeader"; // ✅ Corrected
import { redirect } from "next/navigation";


const layout = async ({ children }: { children: React.ReactNode }) => {
 
  const user = await currentUser();
  if (!user) {
     redirect("/sign-in");
  }
  const loggedInUser = await db.user.findUnique({
    where: { clerkUserId: user.id },
  });
  if (!loggedInUser) {
    await db.user.create({
      data: {
        name: `${user.fullName} ${user.lastName}`,
        clerkUserId: user.id,
        email: user.emailAddresses[0].emailAddress,
        imageUrl: user.imageUrl,
      },
    });
  }
  return (
    <div>
      <ClientHeader />
      {children}
    </div>
  );
};

export default layout;
