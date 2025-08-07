import React, { useState, useEffect } from 'react';
import { useTax } from '@/contexts/TaxContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription, 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Percent, Save, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const TaxSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { settings, loading, error, fetchSettings, updateSettings } = useTax();
  
  const [taxRate, setTaxRate] = useState<number>(0);
  const [currencySymbol, setCurrencySymbol] = useState<string>("Rs");
  const [hotelName, setHotelName] = useState<string>("HSQ Towers");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  
  useEffect(() => {
    if (settings) {
      setTaxRate(settings.taxRate);
      setCurrencySymbol(settings.currencySymbol);
      setHotelName(settings.hotelName);
    }
  }, [settings]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateSettings({
        taxRate,
        currencySymbol,
        hotelName
      });
      
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update settings:", err);
    }
  };
  
  const isAdmin = user?.role === 'admin';
  
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-light text-slate-900 tracking-wide flex items-center">
            <Percent className="h-7 w-7 text-amber-500 mr-3" />
            Tax Configuration
          </h1>
          <p className="text-slate-600 mt-1 font-light">
            Manage tax rates and currency settings for your hotel
          </p>
        </div>
        
        <Card className="border-0 shadow-lg bg-white relative overflow-hidden">
          <div className="absolute top-0 right-0 h-24 w-48 bg-gradient-to-bl from-amber-100/40 to-transparent -z-0" />
          
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-light text-slate-900">
              System Tax Settings
            </CardTitle>
            <CardDescription className="font-light text-slate-500">
              Configure tax rates applied to all invoices
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {loading && !settings ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : error ? (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="hotelName" className="text-slate-700">Hotel Name</Label>
                    <Input
                      id="hotelName"
                      value={hotelName}
                      onChange={(e) => setHotelName(e.target.value)}
                      disabled={!isEditing}
                      className="border-slate-200 focus:border-amber-500 focus:ring-amber-500"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currencySymbol" className="text-slate-700">
                      Currency Symbol
                    </Label>
                    <Input
                      id="currencySymbol"
                      value={currencySymbol}
                      onChange={(e) => setCurrencySymbol(e.target.value)}
                      disabled={!isEditing}
                      className="border-slate-200 focus:border-amber-500 focus:ring-amber-500"
                      required
                      maxLength={5}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxRate" className="text-slate-700">
                    Tax Rate (%)
                  </Label>
                  <div className="relative">
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                      disabled={!isEditing}
                      className="border-slate-200 focus:border-amber-500 focus:ring-amber-500 pr-12"
                      required
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <span className="text-slate-500">%</span>
                    </div>
                  </div>
                  {!isEditing && (
                    <p className="text-sm text-slate-500 mt-1">
                      Current tax rate: <span className="font-medium text-amber-600">{settings?.taxRate}%</span>
                    </p>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                  {isAdmin && !isEditing && (
                    <Button 
                      type="button" 
                      onClick={() => setIsEditing(true)}
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      Update GST
                    </Button>
                  )}
                  
                  {isEditing && (
                    <>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsEditing(false);
                          if (settings) {
                            setTaxRate(settings.taxRate);
                            setCurrencySymbol(settings.currencySymbol);
                            setHotelName(settings.hotelName);
                          }
                        }}
                        className="border-slate-200 text-slate-700 hover:bg-slate-50"
                      >
                        Cancel
                      </Button>
                      
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </Button>
                    </>
                  )}
                </div>
                
                {saveSuccess && (
                  <div className="flex items-center p-3 mt-4 rounded-lg bg-emerald-50 text-emerald-700">
                    <CheckCircle className="h-5 w-5 mr-2 text-emerald-500" />
                    <span>Settings updated successfully!</span>
                  </div>
                )}
                
                {!isAdmin && (
                  <div className="p-3 mt-4 rounded-lg bg-slate-50 text-slate-700 text-sm">
                    Only administrators can modify these settings.
                  </div>
                )}
                
                <div className="mt-6 text-sm text-slate-500 font-light flex items-center justify-between">
                  <p>Last updated: {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'Never'}</p>
                  
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                    <span>Current settings active</span>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaxSettingsPage;