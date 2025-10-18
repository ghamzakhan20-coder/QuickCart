import connectDB from "@/config/db";
import { inngest } from "@/config/inngest";
import Product from "@/models/Product";
import User from "@/models/User";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const { address, items } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: "User not authenticated" });
    }

    if (!address || !items || items.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid data" });
    }

    // connect to DB before any mongoose query
    await connectDB();

    // ✅ Properly calculate amount (no async reduce)
    let amount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return NextResponse.json({
          success: false,
          message: `Product not found: ${item.product}`,
        });
      }
      amount += product.offerPrice * item.quantity;
    }

    // ✅ Add small extra charge (e.g., tax or fee)
    const totalAmount = amount + Math.floor(amount * 0.02);

    // ✅ Send event to Inngest for async order creation
    await inngest.send({
      name: "order/created",
      data: {
        userId,
        address,
        items,
        amount: totalAmount,
        date: Date.now(),
      },
    });

    // ✅ Clear user cart
    const user = await User.findById(userId);
    if (user) {
      user.cartItems = {};
      await user.save();
    }

    return NextResponse.json({ success: true, message: "Order Placed" });
  } catch (error) {
    console.error("Error placing order:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
