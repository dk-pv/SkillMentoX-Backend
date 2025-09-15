import Student from "../models/StudentProfile.js";
import stripe from "../utils/stripe.js";

export const createCheckoutSession = async (req, res) => {
    try {
            const { priceId, subscriptionType, category, stack } = req.body;
            const studentId = req.user.id;

        if (!priceId) {
            return res.status(400).json({ message: "Price ID is required" });
        }

        const student = await Student.findOne({ email: req.user.email });
        if (!student) return res.status(404).json({ message: "Student not found" });

        if (!student.stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: student.email,
                name: student.name,
                metadata: { studentId: student._id.toString() },
            });
            student.stripeCustomerId = customer.id;
            await student.save();
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "subscription",
            customer: student.stripeCustomerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}&category=${category}&stack=${stack}`,
            cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
        });

        return res.json({ url: session.url });
    } catch (err) {
        console.error("Stripe Checkout Error:", err);
        if (err.raw) {
            return res.status(err.statusCode || 500).json({
                message: err.raw.message,
                type: err.raw.type,
                code: err.raw.code,
            });
        }
        return res
            .status(500)
            .json({
                message: "Failed to create checkout session",
                error: err.message,
            });
    }
};

export const stripeWebhook = async (req, res) => {
    let event;
    try {
        const sig = req.headers["stripe-signature"];
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object;
                const student = await Student.findOne({
                    stripeCustomerId: session.customer,
                });
                if (student) {
                    student.isSubscribed = true;
                    student.subscriptionType = "monthly";
                    student.subscriptionStart = new Date();
                    student.subscriptionEnd = new Date(
                        new Date().setMonth(new Date().getMonth() + 1)
                    ); // example monthly
                    student.subscriptionId = session.subscription;
                    await student.save();
                }
                break;
            }
            case "customer.subscription.deleted": {
                const subscription = event.data.object;
                const student = await Student.findOne({
                    subscriptionId: subscription.id,
                });
                if (student) {
                    student.isSubscribed = false;
                    student.subscriptionType = null;
                    student.subscriptionStart = null;
                    student.subscriptionEnd = null;
                    student.subscriptionId = null;
                    await student.save();
                }
                break;
            }
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        res.json({ received: true });
    } catch (err) {
        console.error("Webhook handler failed:", err);
        res.status(500).send("Webhook handler error");
    }
};

export const verifySession = async (req, res) => {
    try {
        const { session_id } = req.query;
        if (!session_id)
            return res
                .status(400)
                .json({ success: false, message: "Missing session_id" });

        const session = await stripe.checkout.sessions.retrieve(session_id);

        if (session.payment_status === "paid") {
            const student = await Student.findOne({
                stripeCustomerId: session.customer,
            });
            if (student) {
                student.isSubscribed = true;
                student.subscriptionType = "monthly";
                student.subscriptionStart = new Date();
                student.subscriptionEnd = new Date(
                    new Date().setMonth(new Date().getMonth() + 1)
                );
                student.subscriptionId = session.subscription;
                await student.save();
            }
            return res.json({ success: true, session });
        } else {
            return res.json({ success: false, message: "Payment not completed" });
        }
    } catch (err) {
        console.error("Error verifying session:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
