"use client";

import { useState } from "react";

import {
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  TextField,
  Typography,
} from "@mui/material";

import { ArrowForward, LockOutlined } from "@mui/icons-material";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import { useAppDispatch, useAppSelector } from "@/app/lib/hooks";

import { clearCart } from "@/app/lib/features/cart/cartSlice";
import { FStore } from "@/firebase/firebase.config";

const checkoutSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name is too long"),

  lastName: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name is too long"),

  email: z.string().trim().email("Please enter a valid email address"),

  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit phone number"),

  address: z
    .string()
    .trim()
    .min(10, "Please enter a complete address")
    .max(200, "Address is too long"),

  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(50, "City name is too long"),

  state: z
    .string()
    .trim()
    .min(2, "State is required")
    .max(50, "State name is too long"),

  pinCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "PIN code must be exactly 6 digits"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const Checkout = () => {
  const dispatch = useAppDispatch();

  const cartItems = useAppSelector((state) => state.cart.items);

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const [orderError, setOrderError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pinCode: "",
    },
  });

  const onSubmit = async (data: CheckoutFormData) => {
    setOrderError("");

    if (cartItems.length === 0) {
      setOrderError("Your cart is empty.");
      return;
    }

    try {
      const orderData = {
        customer: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          pinCode: data.pinCode,
        },

        items: cartItems.map((item) => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          size: item.size ?? null,
          color: item.color ?? null,
        })),

        subtotal: cartTotal,
        shipping: 0,
        total: cartTotal,

        status: "pending",

        createdAt: serverTimestamp(),
      };

      const orderRef = await addDoc(collection(FStore, "orders"), orderData);

      dispatch(clearCart());

      window.location.href = `/order-success?orderId=${orderRef.id}`;
    } catch (error) {
      console.error("Failed to create order:", error);

      setOrderError(
        "Something went wrong while placing your order. Please try again.",
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      <Navbar />

      <main>
        <Container maxWidth="xl">
          {/* Header */}
          <Box
            sx={{
              py: { xs: 5, md: 7 },
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="overline"
              sx={{
                color: "text.secondary",
                letterSpacing: "0.2em",
                fontWeight: 700,
              }}
            >
              DOPAMINE CLUB
            </Typography>

            <Typography
              component="h1"
              sx={{
                mt: 1,
                fontSize: {
                  xs: "2.5rem",
                  md: "4rem",
                },
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: "-0.05em",
              }}
            >
              Checkout
            </Typography>
          </Box>

          {cartItems.length === 0 ? (
            <Box
              sx={{
                minHeight: 500,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                  }}
                >
                  Your cart is empty
                </Typography>

                <Typography
                  sx={{
                    mt: 1,
                    color: "text.secondary",
                  }}
                >
                  Add some products before proceeding to checkout.
                </Typography>

                <Button
                  href="/shop"
                  variant="contained"
                  sx={{
                    mt: 3,
                    height: 48,
                    px: 3,
                    borderRadius: 2,
                    bgcolor: "text.primary",
                    color: "background.paper",
                    fontWeight: 700,

                    "&:hover": {
                      bgcolor: "text.primary",
                      opacity: 0.85,
                    },
                  }}
                >
                  Continue Shopping
                </Button>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                py: { xs: 4, md: 7 },
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "1fr 380px",
                },
                gap: { xs: 4, lg: 6 },
                alignItems: "start",
              }}
            >
              {/* Customer Details */}
              <Card
                sx={{
                  p: { xs: 3, sm: 4, md: 5 },
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "none",
                }}
              >
                <Typography
                  sx={{
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    mb: 3,
                  }}
                >
                  Shipping Information
                </Typography>

                <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="First Name"
                        variant="outlined"
                        {...register("firstName")}
                        error={Boolean(errors.firstName)}
                        helperText={errors.firstName?.message}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        variant="outlined"
                        {...register("lastName")}
                        error={Boolean(errors.lastName)}
                        helperText={errors.lastName?.message}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        variant="outlined"
                        {...register("email")}
                        error={Boolean(errors.email)}
                        helperText={errors.email?.message}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        type="tel"
                        variant="outlined"
                        {...register("phone")}
                        error={Boolean(errors.phone)}
                        helperText={errors.phone?.message}
                        slotProps={{
                          htmlInput: {
                            maxLength: 10,
                          },
                        }}
                      />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Address"
                        multiline
                        rows={3}
                        variant="outlined"
                        {...register("address")}
                        error={Boolean(errors.address)}
                        helperText={errors.address?.message}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="City"
                        variant="outlined"
                        {...register("city")}
                        error={Boolean(errors.city)}
                        helperText={errors.city?.message}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="State"
                        variant="outlined"
                        {...register("state")}
                        error={Boolean(errors.state)}
                        helperText={errors.state?.message}
                      />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        fullWidth
                        label="PIN Code"
                        variant="outlined"
                        {...register("pinCode")}
                        error={Boolean(errors.pinCode)}
                        helperText={errors.pinCode?.message}
                        slotProps={{
                          htmlInput: {
                            maxLength: 6,
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Card>

              {/* Order Summary */}
              <Card
                sx={{
                  p: { xs: 3, sm: 4 },
                  borderRadius: 3,
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  boxShadow: "none",
                  position: {
                    lg: "sticky",
                  },
                  top: {
                    lg: 100,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: "1.25rem",
                    fontWeight: 800,
                  }}
                >
                  Order Summary
                </Typography>

                <Divider sx={{ my: 3 }} />

                {/* Cart Items */}
                {cartItems.map((item) => (
                  <Box
                    key={`${item.id}-${item.size ?? ""}-${item.color ?? ""}`}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.9rem",
                        }}
                      >
                        {item.name} × {item.quantity}
                      </Typography>

                      {item.size && (
                        <Typography
                          sx={{
                            mt: 0.25,
                            color: "text.secondary",
                            fontSize: "0.75rem",
                          }}
                        >
                          Size: {item.size}
                        </Typography>
                      )}

                      {item.color && (
                        <Typography
                          sx={{
                            color: "text.secondary",
                            fontSize: "0.75rem",
                          }}
                        >
                          Color: {item.color}
                        </Typography>
                      )}
                    </Box>

                    <Typography
                      sx={{
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}
                    >
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </Typography>
                  </Box>
                ))}

                <Divider sx={{ my: 3 }} />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography sx={{ color: "text.secondary" }}>
                    Subtotal
                  </Typography>

                  <Typography sx={{ fontWeight: 600 }}>
                    ₹{cartTotal.toFixed(2)}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Typography sx={{ color: "text.secondary" }}>
                    Shipping
                  </Typography>

                  <Typography sx={{ fontWeight: 600 }}>Free</Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 3,
                  }}
                >
                  <Typography sx={{ fontWeight: 700 }}>Total</Typography>

                  <Typography
                    sx={{
                      fontSize: "1.3rem",
                      fontWeight: 900,
                    }}
                  >
                    ₹{cartTotal.toFixed(2)}
                  </Typography>
                </Box>

                {orderError && (
                  <Typography
                    sx={{
                      mb: 2,
                      color: "error.main",
                      fontSize: "0.875rem",
                    }}
                  >
                    {orderError}
                  </Typography>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  type="button"
                  endIcon={<ArrowForward />}
                  disabled={isSubmitting}
                  onClick={handleSubmit(onSubmit)}
                  sx={{
                    height: 52,
                    borderRadius: 2,
                    bgcolor: "text.primary",
                    color: "background.paper",
                    fontWeight: 700,

                    "&:hover": {
                      bgcolor: "text.primary",
                      opacity: 0.85,
                    },
                  }}
                >
                  {isSubmitting ? "Placing Order..." : "Place Order"}
                </Button>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 1,
                    mt: 2.5,
                  }}
                >
                  <LockOutlined
                    sx={{
                      fontSize: 17,
                      color: "text.secondary",
                    }}
                  />

                  <Typography
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.8rem",
                    }}
                  >
                    Secure checkout
                  </Typography>
                </Box>
              </Card>
            </Box>
          )}
        </Container>
      </main>

      <Footer />
    </Box>
  );
};

export default Checkout;
