"use client";

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { getLawyers, type LawyerWithUser, type LawyerFilterParams } from '@/app/api/lawyersApi';
import { useRouter } from 'next/navigation';
// Location options for filtering
const LOCATIONS = [
  "Mumbai, Maharashtra",
  "Delhi, Delhi",
  "Bangalore, Karnataka",
  "Hyderabad, Telangana",
  "Chennai, Tamil Nadu",
  "Kolkata, West Bengal",
  "Pune, Maharashtra",
  "Ahmedabad, Gujarat",
  "Jaipur, Rajasthan",
  "Lucknow, Uttar Pradesh"
];


// All legal specializations
const ALL_SPECIALIZATIONS = [
  "Banking Regulations",
  "Investment Law",
  "International Finance",
  "Tax Law",
  "Corporate Finance",
  "Private Equity & Hedge Funds",
  "Bankruptcy & Restructuring",
  "Mergers & Acquisitions",
  "Anti-Money Laundering",
  "Financial Compliance",
  "Securities Law",
  "Capital Markets",
  "Insurance Law"
];


const LawyerFilter = () => {
  // State for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('any');
  const [minRating, setMinRating] = useState(0);
  const [filteredLawyers, setFilteredLawyers] = useState<LawyerWithUser[]>([]);
  const [activeFilters, setActiveFilters] = useState(0);
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  // Fetch lawyers based on current filters
  useEffect(() => {
    const fetchLawyers = async () => {
      setIsLoading(true);
      try {
        // Only include filters that are active
        const filterParams: LawyerFilterParams = {};
        if (searchQuery) {
          filterParams.search = searchQuery;
        }
        if (selectedSpecializations.length > 0) {
          filterParams.specializations = selectedSpecializations;
        }
        if (minRating > 0) {
          filterParams.minRating = minRating;
        }
        if (selectedLocation && selectedLocation !== "any") {
          filterParams.location = selectedLocation;
        }
        if (showVerifiedOnly) {
          filterParams.verifiedOnly = true;
        }

        const lawyers = await getLawyers(filterParams);
        setFilteredLawyers(lawyers);
        // Count active filters
        let activeFilterCount = 0;
        if (searchQuery) activeFilterCount++;
        if (selectedSpecializations.length > 0) activeFilterCount++;
        if (selectedLocation && selectedLocation !== "any") activeFilterCount++;
        if (minRating > 0) activeFilterCount++;
        if (showVerifiedOnly) activeFilterCount++;

        setActiveFilters(activeFilterCount);
      } catch (error) {
        console.error("Failed to fetch lawyers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimeout = setTimeout(() => {
      fetchLawyers();
    }, 300); // Add a small debounce for better UX

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, selectedSpecializations, minRating, showVerifiedOnly, selectedLocation]);

  // Toggle specialization selection
  const toggleSpecialization = (specialization: string) => {
    setSelectedSpecializations(prev =>
      prev.includes(specialization)
        ? prev.filter(s => s !== specialization)
        : [...prev, specialization]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSpecializations([]);
    setSelectedLocation('any');
    setMinRating(0);
    setShowVerifiedOnly(false);
  };

  // Render star ratings
  const renderStars = (rating: number | null) => {
    if (rating === null) return null;

    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={`${i < Math.floor(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : i < rating
                  ? 'fill-yellow-400 text-yellow-400 opacity-50'
                  : 'text-gray-300'
              }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Find a Lawyer</h1>

          <div className="flex items-center gap-2">
            {/* Mobile filters trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden flex items-center gap-2">
                  <Filter size={18} />
                  <span>Filters</span>
                  {activeFilters > 0 && (
                    <Badge variant="secondary" className="ml-1">{activeFilters}</Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="sm:max-w-md w-full">
                <SheetHeader>
                  <SheetTitle>Filter Lawyers</SheetTitle>
                  <SheetDescription>
                    Apply filters to find the right lawyer for your needs
                  </SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  {/* Specialization filter (mobile) */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Specialization</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {ALL_SPECIALIZATIONS.slice(0, 10).map((spec) => (
                        <div key={spec} className="flex items-center space-x-2">
                          <Checkbox
                            id={`mobile-spec-${spec}`}
                            checked={selectedSpecializations.includes(spec)}
                            onCheckedChange={() => toggleSpecialization(spec)}
                          />
                          <Label htmlFor={`mobile-spec-${spec}`}>{spec}</Label>
                        </div>
                      ))}
                    </div>
                    {ALL_SPECIALIZATIONS.length > 10 && (
                      <Button variant="link" className="p-0 h-auto">
                        Show more
                      </Button>
                    )}
                  </div>

                  {/* Location filter (mobile) */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Location</h3>
                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any location</SelectItem>
                        {LOCATIONS.map(location => (
                          <SelectItem key={location} value={location} >
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rating filter (mobile) */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Minimum Rating</h3>
                      <div className="flex items-center">
                        <Star size={16} className="text-yellow-400 fill-yellow-400 mr-1" />
                        <span>{minRating.toFixed(1)}+</span>
                      </div>
                    </div>
                    <Slider
                      value={[minRating]}
                      min={0}
                      max={5}
                      step={0.5}
                      onValueChange={(vals) => setMinRating(vals[0])}
                      className="w-full"
                    />
                  </div>

                  {/* Verified filter (mobile) */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mobile-verified"
                      checked={showVerifiedOnly}
                      onCheckedChange={(checked) => setShowVerifiedOnly(checked as boolean)}
                    />
                    <Label htmlFor="mobile-verified">Verified lawyers only</Label>
                  </div>

                  {/* Filter actions (mobile) */}
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={clearFilters}>
                      Clear all
                    </Button>
                    <SheetClose asChild>
                      <Button>Apply Filters</Button>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* Search input */}
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full md:w-[300px]"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={14} />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filters Sidebar */}
          <div className="hidden lg:block space-y-6">
            <div className="bg-card rounded-lg border shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Filters</h2>
                {activeFilters > 0 && (
                  <Button variant="ghost" onClick={clearFilters} size="sm">
                    Clear all
                  </Button>
                )}
              </div>

              {/* Specialization filter */}
              <div className="space-y-3">
                <h3 className="font-medium">Specialization</h3>
                <div className="space-y-2">
                  {ALL_SPECIALIZATIONS.slice(0, 8).map((spec) => (
                    <div key={spec} className="flex items-center space-x-2">
                      <Checkbox
                        id={`spec-${spec}`}
                        checked={selectedSpecializations.includes(spec)}
                        onCheckedChange={() => toggleSpecialization(spec)}
                      />
                      <Label htmlFor={`spec-${spec}`} className="text-sm">{spec}</Label>
                    </div>
                  ))}
                  {ALL_SPECIALIZATIONS.length > 8 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-sm">
                          Show more specializations
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="grid grid-cols-1 gap-2">
                          {ALL_SPECIALIZATIONS.slice(8).map((spec) => (
                            <div key={spec} className="flex items-center space-x-2">
                              <Checkbox
                                id={`popup-spec-${spec}`}
                                checked={selectedSpecializations.includes(spec)}
                                onCheckedChange={() => toggleSpecialization(spec)}
                              />
                              <Label htmlFor={`popup-spec-${spec}`} className="text-sm">{spec}</Label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              </div>

              {/* Location filter */}
              <div className="space-y-3">
                <h3 className="font-medium">Location</h3>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any location</SelectItem>
                    {LOCATIONS.map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rating filter */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Minimum Rating</h3>
                  <div className="flex items-center">
                    <Star size={16} className="text-yellow-400 fill-yellow-400 mr-1" />
                    <span className="text-sm">{minRating.toFixed(1)}+</span>
                  </div>
                </div>
                <Slider
                  value={[minRating]}
                  min={0}
                  max={5}
                  step={0.5}
                  onValueChange={(vals) => setMinRating(vals[0])}
                />
              </div>

              {/* Verified filter */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="verified"
                    checked={showVerifiedOnly}
                    onCheckedChange={(checked) => setShowVerifiedOnly(checked as boolean)}
                  />
                  <Label htmlFor="verified">Verified lawyers only</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Lawyers Grid */}
          <div className="lg:col-span-3">
            {/* Active filters */}
            {activeFilters > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {searchQuery && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Search: {searchQuery}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1"
                      onClick={() => setSearchQuery('')}
                    >
                      <X size={12} />
                    </Button>
                  </Badge>
                )}
                {selectedSpecializations.map(spec => (
                  <Badge key={spec} variant="secondary" className="flex items-center gap-1">
                    {spec}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1"
                      onClick={() => toggleSpecialization(spec)}
                    >
                      <X size={12} />
                    </Button>
                  </Badge>
                ))}
                {selectedLocation && selectedLocation !== "any" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <MapPin size={12} className="mr-1" />
                    {selectedLocation}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1"
                      onClick={() => setSelectedLocation('any')}
                    >
                      <X size={12} />
                    </Button>
                  </Badge>
                )}
                {minRating > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star size={12} className="mr-1" />
                    {minRating.toFixed(1)}+
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1"
                      onClick={() => setMinRating(0)}
                    >
                      <X size={12} />
                    </Button>
                  </Badge>
                )}
                {showVerifiedOnly && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Verified only
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 ml-1"
                      onClick={() => setShowVerifiedOnly(false)}
                    >
                      <X size={12} />
                    </Button>
                  </Badge>
                )}
              </div>
            )}

            {/* Results count */}
            <p className="text-sm text-muted-foreground mb-4">
              {isLoading ? 'Loading lawyers...' : `${filteredLawyers.length} lawyers found`}
            </p>

            {/* Loading state */}
            {isLoading ? (
              <div className="text-center py-12 border rounded-lg bg-card">
                <div className="mx-auto flex flex-col items-center justify-center">
                  <div className="rounded-full bg-muted p-6 mb-4 animate-pulse">
                    <Search className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-xl">Loading lawyers...</h3>
                  <p className="text-muted-foreground mt-2 max-w-md">
                    We&apos;re retrieving lawyers from our database, please wait.
                  </p>
                </div>
              </div>
            ) : filteredLawyers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredLawyers.map((lawyer) => (
                  <Card key={lawyer.lawyer_id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="p-4 pb-2 flex flex-row items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={`https://i.pravatar.cc/48?u=${lawyer.user_id}`} alt={`${lawyer.user.first_name} ${lawyer.user.last_name}`} />
                        <AvatarFallback>
                          {lawyer.user.first_name?.charAt(0) || ''}
                          {lawyer.user.last_name?.charAt(0) || ''}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {lawyer.user.first_name} {lawyer.user.last_name}
                            </h3>
                            <p className="text-sm text-white line-clamp-1 ">
                              {lawyer.user.business_name}
                            </p>

                            <p className="text-sm ">
                              {lawyer.user.location}
                            </p>
                          </div>
                          {lawyer.credentials_verified && (
                            <Badge className="ml-2" variant="success">Verified</Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                      <div className="flex items-center mb-2">
                        {renderStars(lawyer.rating)}
                        <span className="text-sm text-muted-foreground ml-2">
                          ({lawyer.rating_count})
                        </span>
                      </div>
                      <p className="text-sm line-clamp-2 mb-3">
                        {lawyer.profile_bio}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {lawyer.specialization.slice(0, 3).map((spec) => (
                          <Badge key={spec} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                        {lawyer.specialization.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{lawyer.specialization.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between">
                      <Button variant="outline" size="sm">View Profile</Button>
                      <Button variant="default" size="sm">Contact</Button>
                      <Button variant="default" size="sm" onClick={
                        () => {
                          router.push(`/chat/${lawyer.user_id}`);
                        }
                      }>Chat</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-card">
                <div className="mx-auto flex flex-col items-center justify-center">
                  <div className="rounded-full bg-muted p-6 mb-4">
                    <Search className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-xl">No lawyers found</h3>
                  <p className="text-muted-foreground mt-2 max-w-md">
                    We couldn&apos;t find any lawyers matching your search criteria.
                    Try adjusting your filters or search query.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={clearFilters}
                  >
                    Clear all filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerFilter; 