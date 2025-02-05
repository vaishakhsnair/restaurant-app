"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useCart } from "..//context/CartContext";
import { useRouter } from "next/navigation";
import { useAuth } from "..//context/AuthContext";
import { useCurrency } from "..//context/CurrencyContext";
import DinoGame from "../components/Dinogame";
import { HandPlatter, MinusIcon, PlusIcon, SearchIcon } from "lucide-react";
import { GrRadialSelected } from "react-icons/gr";

type MenuItemData = {
  name: string;
  price: number;
  description?: string;
  image?: string;
  isAvailable: boolean;
  volume?: string;
};

type MenuItem = {
  _id: string;
  id: string;
  category: string;
  items: MenuItemData[];
};

export default function Menu({ restaurantId }: { restaurantId: string }) {
  const [menuCategories, setMenuCategories] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart, updateQuantity, cartItems } = useCart();
  const router = useRouter();
  const { user } = useAuth();
  const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);
  const [waiterReason, setWaiterReason] = useState<string>("Assistance");
  const [tableNumber, setTableNumber] = useState<string>("");
  const { currency, setCurrency } = useCurrency();

  const handleQuantityUpdate = (
    e: React.MouseEvent,
    categoryId: string,
    itemName: string,
    action: "increase" | "decrease",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const currentQuantity = getItemQuantity(categoryId, itemName);
    const category = menuCategories.find((cat) => cat._id === categoryId);
    const item = category?.items.find((item) => item.name === itemName);

    if (!category || !item) return;

    if (action === "increase") {
      handleAddToCart(category._id, item);
    } else {
      handleUpdateQuantity(categoryId, itemName, currentQuantity - 1);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/menu/${restaurantId}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch menu items");
      }
      const data = await response.json();
      setMenuCategories(data);
      setIsLoading(false);
    } catch (err) {
      setError("Failed to load menu items. Please try again later.");
      console.error(err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
    const intervalId = setInterval(fetchMenuItems, 25000);
    return () => clearInterval(intervalId);
  }, [restaurantId]);

  const categories = [
    "All",
    ...Array.from(new Set(menuCategories.map((item) => item.category))),
  ];

  const filteredCategories =
    activeCategory === "All"
      ? menuCategories
      : menuCategories.filter((item) => item.category === activeCategory);

  const handleViewOrders = () => {
    router.push(`/orders/${user?.phoneNumber}`);
  };

  const getItemQuantity = (categoryId: string, itemName: string) => {
    const cartItem = cartItems.find(
      (item) => item.categoryId === categoryId && item.name === itemName,
    );
    return cartItem ? cartItem.quantity : 0;
  };

  const handleAddToCart = (categoryId: string, item: MenuItemData) => {
    if (item.isAvailable) {
      addToCart({
        _id: `${categoryId}-${item.name}`,
        categoryId,
        name: item.name,
        price: item.price,
        image: item.image,
        description: item.description,
        isAvailable: item.isAvailable,
        volume: item.volume,
      });
    }
  };

  const handleUpdateQuantity = (
    categoryId: string,
    itemName: string,
    newQuantity: number,
  ) => {
    updateQuantity(`${categoryId}-${itemName}`, newQuantity);
  };

  const handleItemClick = (categoryId: string, itemName: string) => {
    router.push(`/menu-item/${categoryId}/${itemName}`);
  };

  const handleCallWaiter = async () => {
    if (!tableNumber) {
      alert("Please enter a table number.");
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/waiter-request/waiter-assistance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            restaurantId,
            tableNumber: parseInt(tableNumber),
            reason: waiterReason,
          }),
        },
      );
      if (!response.ok) {
        throw new Error("Failed to call waiter");
      }
      alert(
        `Waiter has been called for ${waiterReason.toLowerCase()} at table ${tableNumber}.`,
      );
      setIsWaiterModalOpen(false);
      setWaiterReason("Assistance");
      setTableNumber("");
    } catch (error) {
      console.error("Error calling waiter:", error);
      alert("Failed to call waiter. Please try again.");
    }
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading menu items...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">{error}</div>;
  }

  return (
    <div className="w-full pb-16">
      <div
        className="sticky top-0 bg-white/30
        backdrop-blur-lg
        text-white/50 rounded-xl
        py-2
        z-10 shadow-md
        flex justify-between items-center px-2"
      >
        <div className="flex items-center ">
          <SearchIcon size={22} />
          <input
            type="text"
            placeholder="Search Menu..."
            className="bg-transparent text-white ml-2 focus:outline-none"
          />
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsWaiterModalOpen(true)}
            className="bg-yellow-500 text-white px-4 py-2 rounded-full hover:bg-yellow-600 transition-colors"
          >
            <HandPlatter size={22} />
          </button>
          <DinoGame />
        </div>
      </div>

      {/* Waiter Call Modal */}
      {isWaiterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white/40 backdrop-blur-xl mx-10 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl text-white font-bold mb-4">Call Waiter</h2>
            <select
              value={waiterReason}
              onChange={(e) => setWaiterReason(e.target.value)}
              className="w-full p-2 mb-4 border rounded outline-none "
            >
              <option value="Assistance">General Assistance</option>
              <option value="Clean Table">Clean Table</option>
              <option value="Order Issue">Order Issue</option>
              <option value="Refill">Refill</option>
            </select>
            <input
              type="number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Enter table number"
              className="w-full p-2 mb-4 border rounded"
            />
            <div className="flex justify-end">
              <button
                onClick={() => setIsWaiterModalOpen(false)}
                className="mr-2 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCallWaiter}
                className="px-4 py-2 bg-yellow-700 font-bold text-white rounded hover:bg-yellow-600 transition-colors"
              >
                Call Waiter
              </button>
            </div>
          </div>
        </div>
      )}

      <div className=" backdrop-blur-sm rounded-xl shadow-md z-10 my-2 max-w-full ">
        <div className="flex gap-2 overflow-x-scroll
        w-full
         rounded-xl px-4 
         items-center ">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`min-w-20 p-2 rounded-xl whitespace-nowrap ${
                activeCategory === category
                  ? "bg-white/50 text-white"
                  : "bg-white/20 text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-4 mb-4 relative">
        {filteredCategories.map((category) =>
          category.items.map((item) => (
            // <div
            //   key={`${category._id}-${item.name}`}
            //   className={`flex items-center bg-white/20 text-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md relative transition-shadow ${!item.isAvailable ? "opacity-50" : ""}`}
            //   onClick={() => handleItemClick(category._id, item.name)}
            // >
            //   <div className="relative w-24 h-24 mr-4 bg-gray-200 rounded-md">
            //     {item.image && (
            //       <Image
            //         src={`data:image/jpeg;base64,${item.image}`}
            //         alt={item.name}
            //         layout="fill"
            //         objectFit="fit"
            //         className="rounded-xl"
            //       />
            //     )}
            //     {!item.isAvailable && (
            //       <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
            //         <span className="text-white font-bold">Out of Stock</span>
            //       </div>
            //     )}
            //   </div>
            //   <div className="flex-grow">
            //     <h3 className="font-bold text-lg">{item.name}</h3>
            //     <p className="text-white  mt-1">
            //       {currency}
            //       {item.price}
            //     </p>
            //     {item.volume && (
            //       <p className="text-gray-500 text-sm">{item.volume}</p>
            //     )}
            //   </div>
            //   <div
            //     className="flex items-center absolute right-[2%] bottom-4"
            //     onClick={(e) => {
            //       e.preventDefault();
            //       e.stopPropagation();
            //     }}
            //   >
            //     {item.isAvailable ? (
            //       getItemQuantity(category._id, item.name) === 0 ? (
            //         <button
            //           onClick={(e) =>
            //             handleQuantityUpdate(
            //               e,
            //               category._id,
            //               item.name,
            //               "increase",
            //             )
            //           }
            //           className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors"
            //         >
            //           Add
            //         </button>
            //       ) : (
            //         <div className="flex items-center">
            //           <button
            //             className="bg-white rounded-full p-1"
            //             onClick={(e) =>
            //               handleQuantityUpdate(
            //                 e,
            //                 category._id,
            //                 item.name,
            //                 "decrease",
            //               )
            //             }
            //           >
            //             <MinusIcon size={22} color="black" />
            //           </button>
            //           <span className="mx-2 w-8 text-center font-bold">
            //             {getItemQuantity(category._id, item.name)}
            //           </span>
            //           <button
            //             className="bg-white rounded-full p-1"
            //             onClick={(e) =>
            //               handleQuantityUpdate(
            //                 e,
            //                 category._id,
            //                 item.name,
            //                 "increase",
            //               )
            //             }
            //           >
            //             <PlusIcon size={22} color="black" />
            //           </button>
            //         </div>
            //       )
            //     ) : (
            //       <span className="text-red-500 font-semibold">
            //         Unavailable
            //       </span>
            //     )}
            //   </div>
            // </div>
            <div
              className="w-full
                 h-32 backdrop-blur-sm"
            >
            <div 
              className="flex w-full
                 h-[8.5rem] bg-white/20  backdrop-blur-sm
                 rounded-3xl  overflow-hidden
                  p-4 text-white productsans-regular"
            >
              <div
                className="flex flex-col"
              >
                <p
                  className="font-bold 
                  flex w-fit items-center 
                  justify-center gap-2 text-xl"
                >
                  <GrRadialSelected size={20} color="#7BDD97"/>
                  {item.name}</p>
                <p className="text-xl text-gray-200 poppins-regular">₹{item.price}</p>
 
                <p className="text-base mt-3 text-gray-200 ">Availability : {item.volume}</p>
              </div>


              <img 
                className="absolute h-32  w-40 -mt-4 -right-4  -z-10 " 
                src={`data:image/jpeg;base64,${item.image}`}  
              />
            
            </div>
            <div className="
                absolute bg-white/20 backdrop-blur-3xl
                w-36 h-10 -bottom-2 right-0 rounded-br-xl
                flex justify-evenly cursor-pointer items-center
              ">
(               <p
                onClick={(e) =>
                    handleQuantityUpdate(
                      e,
                      category._id,
                      item.name,
                      "decrease",
                    )
                  }
                className="text-white text-4xl font-bold">-</p>
               <p className="text-white text-2xl font-bold">{getItemQuantity(category._id, item.name)}</p>
               <p
                  onClick={(e) =>
                  handleQuantityUpdate(
                    e,
                    category._id,
                    item.name,
                    "increase",
                  )
                }
               className="text-white text-4xl font-bold">+</p>)
               
             </div>

            </div>
            



          )),
        )}
      </div>
    </div>
  );
}
