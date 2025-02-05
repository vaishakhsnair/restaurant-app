"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Menu from "..//../components/Menu";
import { CartProvider, useCart } from "..//../context/CartContext";
import { AuthProvider, useAuth } from "..//../context/AuthContext";
import { CurrencyProvider, useCurrency } from "..//../context/CurrencyContext";
import CartIcon from "..//../components/CartIcon";
import FloatingCartIcon from "..//../components/FloatingCartIcon";
import Login from "..//../components/Login";
import Register from "..//../components/Register";
import Head from "next/head";
import NavBar from "@/app/components/NavBar";
import { DotLoader } from "react-spinners";

type BannerImage = {
  data: string; // base64 data
  contentType: string;
};

type Restaurant = {
  id: string;
  name: string;
  bannerImage: BannerImage;
  currency: string;
};

function RestaurantContent() {
  const params = useParams();
  const { id } = params;
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const { user } = useAuth();
  const { setRestaurantId } = useCart();
  const [showRegister, setShowRegister] = useState(false);
  const { clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setCurrency } = useCurrency();

  useEffect(() => {
    const fetchRestaurant = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/${id}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch restaurant details");
        }
        const data = await response.json();
        setRestaurant(data[0]);
        setRestaurantId(id as string);

        // Set the restaurant's currency
        if (data[0].currency) {
          setCurrency(data[0].currency);
        }
        // Create image URL from base64 data
        if (data[0].bannerImage) {
          const imageUrl = `data:${data[0].bannerImage.contentType};base64,${data[0].bannerImage}`;
          setBannerUrl(imageUrl);
        }
      } catch (err) {
        setError("Failed to load restaurant details. Please try again later.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurant();
    // Cleanup function to reset currency when unmounting
    return () => {
      setCurrency("₹"); // Reset to default currency
    };
  }, [id, setRestaurantId, setCurrency]);

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        {showRegister ? <Register /> : <Login />}
        <button
          onClick={() => setShowRegister(!showRegister)}
          className="mt-4 text-blue-500 hover:text-blue-700"
        >
          {showRegister
            ? "Already have an account? Login"
            : "Don't have an account? Register"}
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        className="min-h-screen bg-black min-w-screen max-w-screen text-white
              bg-[url(/snacks-bg.webp)]
             flex flex-col items-center justify-center max-h-screen overflow-y-hidden gap-10 overflow-x-hidden "
      >
        <DotLoader color="#fff" />
        Loading details
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div
        className="min-h-screen bg-black min-w-screen max-w-screen
              bg-[url(/snacks-bg.webp)] text-white
             flex flex-col items-center max-h-screen overflow-y-hidden overflow-x-hidden"
      >
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">
            {error || "Failed to load restaurant"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-black min-w-screen max-w-screen
              bg-[url(/snacks-bg.webp)]
             flex flex-col items-center max-h-screen overflow-y-hidden overflow-x-hidden"
    >
      <div className="min-h-[98vh] min-w-[95vw] max-w-[95vw] flex flex-col items-center overflow-y-scroll no-scrollbar overflow-x-hidden">
        <div
          className="relative min-h-[20vh] w-full h-fit
        bg-gray-800 mt-4 mx-2
        rounded-xl "
        >
          {bannerUrl && (
            <Image
              src={bannerUrl}
              alt={restaurant.name}
              layout="fill"
              objectFit="fit"
              className="brightness-50 rounded-xl min-h-fit "
              priority
            />
          )}

          <div className="absolute inset-0 flex flex-col  justify-end">
            <h1
              className="text-4xl font-bold text-white text-left p-6
                        font-(grifter)"
            >
              {restaurant.name}
            </h1>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <Menu restaurantId={id as string} />
        </div>
      </div>
      <NavBar restaurantId={id as string} />
    </div>
  );
}

export default function RestaurantPage() {
  return (
    <AuthProvider>
      {/* <CurrencyProvider> */}
      <CartProvider>
        <RestaurantContent />
      </CartProvider>
      {/* </CurrencyProvider> */}
    </AuthProvider>
  );
}
