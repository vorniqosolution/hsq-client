import { useEffect, useState, useRef } from 'react';
import { useInventory } from '@/contexts/InventoryContext';
import { toast } from 'sonner';

const NOTIFICATION_INTERVAL = 3600000; // 1 hour in milliseconds

export const useLowStockNotifier = () => {
  const { lowStockItems, loading } = useInventory();
  
  // Use a ref to store notified item IDs to avoid re-renders
  const notifiedItemIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Don't run the interval logic until the initial data has loaded
    if (loading) {
      return;
    }

    const checkLowStock = () => {
      // Get the IDs of currently low stock items
      const currentLowStockIds = new Set(lowStockItems.map(item => item._id));

      // Find items that are newly low on stock (not yet notified)
      const newLowStockItems = lowStockItems.filter(
        item => !notifiedItemIds.current.has(item._id)
      );

      if (newLowStockItems.length > 0) {
        // Construct the notification message
        const title = `Low Stock Alert (${newLowStockItems.length} new ${newLowStockItems.length === 1 ? 'item' : 'items'})`;
        const description = newLowStockItems
          .map(item => `${item.name} (${item.quantityOnHand} left)`)
          .join(', ');
        
        // Show a toast notification
        toast.warning(title, {
          description: description,
          duration: 10000, // Show for 10 seconds
        });

        // Update our notified list
        newLowStockItems.forEach(item => notifiedItemIds.current.add(item._id));
      }

      // Cleanup: Remove items from notified list if they have been restocked
      notifiedItemIds.current.forEach(id => {
        if (!currentLowStockIds.has(id)) {
          notifiedItemIds.current.delete(id);
        }
      });
    };

    // Run the check once immediately after initial load
    checkLowStock();
    
    // Set up the interval to run every hour
    const intervalId = setInterval(checkLowStock, NOTIFICATION_INTERVAL);

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(intervalId);

  }, [lowStockItems, loading]); // Rerun effect if low stock items or loading state changes
};