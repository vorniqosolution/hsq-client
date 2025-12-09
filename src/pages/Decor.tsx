// import React, { useState, useEffect } from "react";
// import { Edit, Trash2, X } from "lucide-react";
// import { useInventory } from "@/contexts/InventoryContext";
// import { useDecor } from "@/contexts/DecorContext";

// export default function Decor() {
//   const { items } = useInventory();
//   const { createPackage, packages, fetchPackages } = useDecor();

//   const [openAdd, setOpenAdd] = useState(false);

//   const [newPackage, setNewPackage] = useState({
//     title: "",
//     price: "",
//     description: "",
//     isCustom: false,
//     itemsQty: {} as Record<string, number>,
//     images: [] as File[],
//   });

//   useEffect(() => {
//     fetchPackages();
//   }, [fetchPackages]);

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files) {
//       setNewPackage((prev) => ({
//         ...prev,
//         images: Array.from(e.target.files),
//       }));
//     }
//   };

//   const increaseQty = (itemName: string) => {
//     setNewPackage((prev) => ({
//       ...prev,
//       itemsQty: {
//         ...prev.itemsQty,
//         [itemName]: (prev.itemsQty[itemName] || 0) + 1,
//       },
//     }));
//   };

//   const decreaseQty = (itemName: string) => {
//     setNewPackage((prev) => {
//       const current = prev.itemsQty[itemName] || 0;
//       if (current <= 1) {
//         const updated = { ...prev.itemsQty };
//         delete updated[itemName];
//         return { ...prev, itemsQty: updated };
//       }
//       return {
//         ...prev,
//         itemsQty: { ...prev.itemsQty, [itemName]: current - 1 },
//       };
//     });
//   };

//   const removeImage = (index: number) => {
//     setNewPackage((prev) => {
//       const updated = [...prev.images];
//       updated.splice(index, 1);
//       return { ...prev, images: updated };
//     });
//   };

//   const savePackage = async () => {
//     if (!newPackage.title || !newPackage.description || !newPackage.price) {
//       alert("Title, Price, and Description are required");
//       return;
//     }

//     if (Object.keys(newPackage.itemsQty).length === 0) {
//       alert("Please select at least one item with quantity");
//       return;
//     }

//     if (newPackage.images.length < 3) {
//       alert("Please upload at least 3 images");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("title", newPackage.title);
//     formData.append("description", newPackage.description);
//     formData.append("price", newPackage.price.toString());
//     formData.append("isCustom", newPackage.isCustom ? "true" : "false");

//     const inventoryArray = Object.entries(newPackage.itemsQty)
//       .map(([itemName, qty]) => {
//         const item = items.find((i) => i.name === itemName);
//         return item ? { item: item._id, quantity: qty } : null;
//       })
//       .filter(Boolean);

//     formData.append("inventoryRequirements", JSON.stringify(inventoryArray));

//     newPackage.images.forEach((file) => {
//       formData.append("images", file);
//     });

//     try {
//       await createPackage(formData);
//       alert("Decor package created successfully");
//       setNewPackage({
//         title: "",
//         price: "",
//         description: "",
//         isCustom: false,
//         itemsQty: {},
//         images: [],
//       });
//       setOpenAdd(false);
//     } catch (err: any) {
//       alert(err.response?.data?.message || "Failed to create decor package");
//     }
//   };

//   return (
//     <div className="p-6">
//       <h1 className="text-3xl font-bold mb-6">Decor Packages</h1>
//       <button
//         className="px-4 py-2 bg-green-600 text-white rounded-lg mb-6 hover:bg-green-700"
//         onClick={() => setOpenAdd(true)}
//       >
//         + Add Package
//       </button>

//       {openAdd && (
//         <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//           <div className="bg-white rounded-xl w-full max-w-2xl p-6 relative">
//             <h2 className="text-xl font-bold mb-4">Add New Decor Package</h2>
//             <input
//               type="text"
//               placeholder="Title"
//               value={newPackage.title}
//               onChange={(e) =>
//                 setNewPackage({ ...newPackage, title: e.target.value })
//               }
//               className="w-full border rounded p-2 mb-2"
//             />
//             <input
//               type="number"
//               placeholder="Price"
//               value={newPackage.price}
//               onChange={(e) =>
//                 setNewPackage({ ...newPackage, price: e.target.value })
//               }
//               className="w-full border rounded p-2 mb-2"
//             />
//             <textarea
//               placeholder="Description"
//               value={newPackage.description}
//               onChange={(e) =>
//                 setNewPackage({ ...newPackage, description: e.target.value })
//               }
//               className="w-full border rounded p-2 mb-2"
//             />

//             <div className="mb-2 flex items-center gap-2">
//               <input
//                 type="checkbox"
//                 checked={newPackage.isCustom}
//                 onChange={(e) =>
//                   setNewPackage({ ...newPackage, isCustom: e.target.checked })
//                 }
//               />
//               <span>Custom Package</span>
//             </div>

//             <div className="mb-2">
//               <label className="font-medium mb-1 block">Items:</label>
//               <div className="flex flex-wrap gap-3">
//                 {items.map((item) => (
//                   <div
//                     key={item._id}
//                     className="flex items-center gap-2 border rounded-full px-3 py-1"
//                   >
//                     <span className="text-sm font-medium">{item.name}</span>
//                     <button
//                       onClick={() => decreaseQty(item.name)}
//                       className="px-2 bg-gray-200 rounded-full"
//                     >
//                       −
//                     </button>
//                     <span className="w-6 text-center">
//                       {newPackage.itemsQty[item.name] || 0}
//                     </span>
//                     <button
//                       onClick={() => increaseQty(item.name)}
//                       className="px-2 bg-gray-200 rounded-full"
//                     >
//                       +
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="mb-2">
//               <label className="font-medium mb-1 block">
//                 Upload Images (min 3):
//               </label>
//               <input
//                 type="file"
//                 multiple
//                 accept="image/*"
//                 onChange={handleImageChange}
//               />
//               <div className="flex gap-2 mt-2 flex-wrap">
//                 {newPackage.images.map((file, index) => (
//                   <div key={index} className="relative">
//                     <img
//                       src={URL.createObjectURL(file)}
//                       alt="preview"
//                       className="w-24 h-24 object-cover rounded"
//                     />
//                     <button
//                       type="button"
//                       onClick={() => removeImage(index)}
//                       className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
//                     >
//                       <X size={14} />
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </div>

//             <div className="flex justify-end gap-2 mt-4">
//               <button
//                 onClick={() => setOpenAdd(false)}
//                 className="px-4 py-2 border rounded hover:bg-gray-100"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={savePackage}
//                 className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
//               >
//                 Save
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {packages.map((pkg: any) => (
//           <div
//             key={pkg._id}
//             className="p-4 border rounded-xl flex flex-col gap-2"
//           >
//             <h2 className="text-lg font-bold">{pkg.title}</h2>
//             <p className="text-gray-600">Price: Rs {pkg.price}</p>
//             <p className="text-gray-500">{pkg.description}</p>
//             <p className="text-gray-500">Customize:{pkg.isCustom}</p>

//             <p className="text-gray-700 font-medium">
//               Items:{" "}
//               {pkg.inventoryRequirements
//                 .map((i: any) => `${i.item} (${i.quantity})`)
//                 .join(", ")}
//             </p>
//             <div className="flex gap-2 flex-wrap mt-2">
//               {pkg.images.map((img: string, idx: number) => (
//                 <img
//                   key={idx}
//                   src={img}
//                   alt="decor"
//                   className="w-20 h-20 object-cover rounded"
//                 />
//               ))}
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
// Full updated Decor component with Update + Delete dialogs
import React, { useState, useEffect } from "react";
import { Edit, Trash2, X } from "lucide-react";
import { useInventory } from "@/contexts/InventoryContext";
import { useDecor } from "@/contexts/DecorContext";

export default function Decor() {
  const { items } = useInventory();
  const {
    createPackage,
    packages,
    fetchPackages,
    updatePackage,
    deletePackage,
  } = useDecor();

  const [openAdd, setOpenAdd] = useState(false);
  const [openUpdate, setOpenUpdate] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);

  const [formState, setFormState] = useState({
    title: "",
    price: "",
    description: "",
    isCustom: false,
    itemsQty: {} as Record<string, number>,
    images: [] as File[],
  });

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  const resetForm = () =>
    setFormState({
      title: "",
      price: "",
      description: "",
      isCustom: false,
      itemsQty: {},
      images: [],
    });

  const loadPkgToForm = (pkg: any) => {
    const itemsQty = (pkg.inventoryRequirements || []).reduce(
      (acc: any, cur: any) => {
        // cur.item may be a populated object or a string (name)
        const name = cur?.item?.name ? cur.item.name : cur?.item;
        if (name) acc[name] = cur.quantity;
        return acc;
      },
      {}
    );

    setFormState({
      title: pkg.title || "",
      price: pkg.price ?? "",
      description: pkg.description || "",
      isCustom: !!pkg.isCustom,
      itemsQty,
      images: [], // user can upload new images if needed
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormState((prev) => ({ ...prev, images: Array.from(e.target.files) }));
    }
  };

  const increaseQty = (name: string) => {
    setFormState((prev) => ({
      ...prev,
      itemsQty: { ...prev.itemsQty, [name]: (prev.itemsQty[name] || 0) + 1 },
    }));
  };

  const decreaseQty = (name: string) => {
    setFormState((prev) => {
      const cur = prev.itemsQty[name] || 0;
      if (cur <= 1) {
        const up = { ...prev.itemsQty };
        delete up[name];
        return { ...prev, itemsQty: up };
      }
      return { ...prev, itemsQty: { ...prev.itemsQty, [name]: cur - 1 } };
    });
  };

  const saveNew = async () => {
    if (!formState.title || !formState.price || !formState.description) {
      alert("All fields required");
      return;
    }
    if (Object.keys(formState.itemsQty).length === 0) {
      alert("Select items");
      return;
    }
    if (formState.images.length < 3) {
      alert("Upload min 3 images");
      return;
    }

    const fd = new FormData();
    fd.append("title", formState.title);
    fd.append("price", String(formState.price));
    fd.append("description", formState.description);
    fd.append("isCustom", String(formState.isCustom));

    const arr = Object.entries(formState.itemsQty).map(([name, qty]) => {
      const item = items.find((i) => i.name === name);
      return { item: item?._id ?? name, quantity: qty };
    });

    fd.append("inventoryRequirements", JSON.stringify(arr));
    formState.images.forEach((f) => fd.append("images", f));

    try {
      await createPackage(fd);
      resetForm();
      setOpenAdd(false);
      fetchPackages();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to create package");
    }
  };

  const saveUpdate = async () => {
    if (!selectedPkg) return;
    if (!formState.title || !formState.price || !formState.description) {
      alert("All fields required");
      return;
    }
    if (Object.keys(formState.itemsQty).length === 0) {
      alert("Select items");
      return;
    }

    const fd = new FormData();
    fd.append("title", formState.title);
    fd.append("price", String(formState.price));
    fd.append("description", formState.description);
    fd.append("isCustom", String(formState.isCustom));

    const arr = Object.entries(formState.itemsQty).map(([name, qty]) => {
      const item = items.find((i) => i.name === name);
      return { item: item?._id ?? name, quantity: qty };
    });

    fd.append("inventoryRequirements", JSON.stringify(arr));
    formState.images.forEach((f) => fd.append("images", f));

    try {
      await updatePackage(selectedPkg._id, fd);
      setOpenUpdate(false);
      resetForm();
      setSelectedPkg(null);
      fetchPackages();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to update package");
    }
  };

  const confirmDelete = async () => {
    if (!selectedPkg) return;
    try {
      await deletePackage(selectedPkg._id);
      setOpenDelete(false);
      setSelectedPkg(null);
      fetchPackages();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Failed to delete package");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Decor Packages</h1>

      <button
        className="px-4 py-2 bg-green-600 text-white rounded-lg"
        onClick={() => {
          resetForm();
          setOpenAdd(true);
        }}
      >
        + Add Package
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {packages.map((pkg: any) => (
          <div key={pkg._id} className="border p-4 rounded-xl shadow-sm">
            <h2 className="text-xl font-bold">{pkg.title}</h2>
            <p>Price: Rs {pkg.price}</p>
            <p>{pkg.description}</p>
            <p>Customize: {pkg.isCustom ? "Yes" : "No"}</p>

            <p className="text-gray-700 font-medium mt-2">
              Items:{" "}
              {(pkg.inventoryRequirements || [])
                .map((i: any) => {
                  const name = i?.item?.name ? i.item.name : i.item;
                  return `${name} (${i.quantity})`;
                })
                .join(", ")}
            </p>

            <div className="flex gap-2 flex-wrap mt-2">
              {(pkg.images || []).map((img: string, idx: number) => (
                <img
                  key={idx}
                  src={img}
                  alt="decor"
                  className="w-20 h-20 object-cover rounded"
                />
              ))}
            </div>

            <div className="flex gap-2 mt-3">
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded flex items-center gap-1"
                onClick={() => {
                  setSelectedPkg(pkg);
                  loadPkgToForm(pkg);
                  setOpenUpdate(true);
                }}
              >
                <Edit size={14} /> Update
              </button>

              <button
                className="px-3 py-1 bg-red-600 text-white rounded flex items-center gap-1"
                onClick={() => {
                  setSelectedPkg(pkg);
                  setOpenDelete(true);
                }}
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD MODAL */}
      {openAdd && (
        <Modal
          title="Add Package"
          onClose={() => setOpenAdd(false)}
          onSave={saveNew}
        >
          <Form
            items={items}
            formState={formState}
            setFormState={setFormState}
            increaseQty={increaseQty}
            decreaseQty={decreaseQty}
            handleImageChange={handleImageChange}
          />
        </Modal>
      )}

      {/* UPDATE MODAL */}
      {openUpdate && (
        <Modal
          title="Update Package"
          onClose={() => {
            setOpenUpdate(false);
            setSelectedPkg(null);
          }}
          onSave={saveUpdate}
        >
          <Form
            items={items}
            formState={formState}
            setFormState={setFormState}
            increaseQty={increaseQty}
            decreaseQty={decreaseQty}
            handleImageChange={handleImageChange}
          />
        </Modal>
      )}

      {/* DELETE CONFIRM */}
      {openDelete && selectedPkg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-80">
            <h2 className="text-lg font-bold">Are you sure?</h2>
            <p className="mt-2">This decor will be deleted permanently.</p>

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2"
                onClick={() => setOpenDelete(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Modal({ title, onClose, onSave, children }: any) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 w-full max-w-2xl rounded-xl">
        <h2 className="text-xl font-bold mb-4">{title}</h2>

        {children}

        <div className="flex justify-end gap-2 mt-4">
          <button className="px-4 py-2" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded"
            onClick={onSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Form({
  items,
  formState,
  setFormState,
  increaseQty,
  decreaseQty,
  handleImageChange,
}: any) {
  return (
    <div>
      <input
        type="text"
        placeholder="Title"
        className="w-full border p-2 mb-2 rounded"
        value={formState.title}
        onChange={(e) => setFormState({ ...formState, title: e.target.value })}
      />

      <input
        type="number"
        placeholder="Price"
        className="w-full border p-2 mb-2 rounded"
        value={formState.price}
        onChange={(e) => setFormState({ ...formState, price: e.target.value })}
      />

      <textarea
        placeholder="Description"
        className="w-full border p-2 mb-2 rounded"
        value={formState.description}
        onChange={(e) =>
          setFormState({ ...formState, description: e.target.value })
        }
      />

      <div className="mb-2 flex items-center gap-2">
        <input
          type="checkbox"
          checked={!!formState.isCustom}
          onChange={(e) =>
            setFormState({ ...formState, isCustom: e.target.checked })
          }
        />
        <span>Custom Package</span>
      </div>

      <div>
        <label className="font-semibold">Items:</label>
        <div className="flex flex-wrap gap-3 mt-2">
          {items.map((i: any) => (
            <div
              key={i._id}
              className="flex items-center gap-2 border px-3 py-1 rounded-full"
            >
              <span>{i.name}</span>

              <button
                type="button"
                className="px-2 bg-gray-200 rounded"
                onClick={() => decreaseQty(i.name)}
              >
                -
              </button>

              <span>{formState.itemsQty?.[i.name] || 0}</span>

              <button
                type="button"
                className="px-2 bg-gray-200 rounded"
                onClick={() => increaseQty(i.name)}
              >
                +
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <label className="font-semibold">Upload Images (min 3)</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="mt-2"
        />
        <div className="flex gap-2 mt-2 flex-wrap">
          {formState.images?.map((file: File, idx: number) => (
            <div key={idx} className="relative">
              <img
                src={URL.createObjectURL(file)}
                alt="preview"
                className="w-24 h-24 object-cover rounded"
              />
              <button
                type="button"
                onClick={() =>
                  setFormState((prev: any) => {
                    const arr = [...(prev.images || [])];
                    arr.splice(idx, 1);
                    return { ...prev, images: arr };
                  })
                }
                className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
