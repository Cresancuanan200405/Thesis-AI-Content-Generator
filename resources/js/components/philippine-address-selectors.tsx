import { useEffect, useState } from 'react';
import {
    barangays,
    cities,
    provinces,
    regions,
} from 'select-philippines-address';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type AddressField = 'region' | 'province' | 'city_municipality' | 'barangay';

type RegionOption = {
    region_name: string;
    region_code: string;
};

type ProvinceOption = {
    province_name: string;
    province_code: string;
    region_code?: string;
};

type CityOption = {
    city_name: string;
    city_code: string;
    province_code?: string;
};

type BarangayOption = {
    brgy_name: string;
    brgy_code: string;
    city_code?: string;
};

type PhilippineAddressSelectorsProps = {
    region: string;
    province: string;
    cityMunicipality: string;
    barangay: string;
    onChange: (field: AddressField, value: string) => void;
    compact?: boolean;
};

const isRecordArray = (value: unknown): value is Record<string, unknown>[] =>
    Array.isArray(value);

export function PhilippineAddressSelectors({
    region,
    province,
    cityMunicipality,
    barangay,
    onChange,
    compact = false,
}: PhilippineAddressSelectorsProps) {
    const [regionOptions, setRegionOptions] = useState<RegionOption[]>([]);
    const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>(
        [],
    );
    const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
    const [barangayOptions, setBarangayOptions] = useState<BarangayOption[]>(
        [],
    );

    const [selectedRegionCode, setSelectedRegionCode] = useState('');
    const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
    const [selectedCityCode, setSelectedCityCode] = useState('');

    // Fetch all regions on mount
    useEffect(() => {
        let isMounted = true;

        void regions().then((allRegions: unknown) => {
            if (!isMounted) {
                return;
            }

            const normalizedRegions = isRecordArray(allRegions)
                ? (allRegions as RegionOption[])
                : [];

            setRegionOptions(normalizedRegions);

            if (region) {
                const match = normalizedRegions.find(
                    (item) => item.region_name === region,
                );
                setSelectedRegionCode(match?.region_code ?? '');
            } else {
                setSelectedRegionCode('');
            }
        });

        return () => {
            isMounted = false;
        };
    }, []);

    // Sync selectedRegionCode when region prop changes
    useEffect(() => {
        if (!region || regionOptions.length === 0) {
            if (!region) {
                setSelectedRegionCode('');
            }

            return;
        }

        const match = regionOptions.find((item) => item.region_name === region);

        if (match && match.region_code !== selectedRegionCode) {
            setSelectedRegionCode(match.region_code);
        }
    }, [region, regionOptions]);

    // Fetch provinces when selectedRegionCode changes
    useEffect(() => {
        if (!selectedRegionCode) {
            setProvinceOptions([]);
            setSelectedProvinceCode('');

            return;
        }

        let isMounted = true;

        void provinces(selectedRegionCode).then((allProvinces: unknown) => {
            if (!isMounted) {
                return;
            }

            const normalizedProvinces = isRecordArray(allProvinces)
                ? (allProvinces as ProvinceOption[])
                : [];

            setProvinceOptions(normalizedProvinces);

            if (province) {
                const match = normalizedProvinces.find(
                    (item) => item.province_name === province,
                );

                if (match) {
                    setSelectedProvinceCode(match.province_code);

                    return;
                }
            }

            setSelectedProvinceCode('');
        });

        return () => {
            isMounted = false;
        };
    }, [selectedRegionCode]);

    // Sync selectedProvinceCode when province prop changes
    useEffect(() => {
        if (!province || provinceOptions.length === 0) {
            if (!province) {
                setSelectedProvinceCode('');
            }

            return;
        }

        const match = provinceOptions.find(
            (item) => item.province_name === province,
        );

        if (match && match.province_code !== selectedProvinceCode) {
            setSelectedProvinceCode(match.province_code);
        }
    }, [province, provinceOptions]);

    // Fetch cities when selectedProvinceCode changes
    useEffect(() => {
        if (!selectedProvinceCode) {
            setCityOptions([]);
            setSelectedCityCode('');

            return;
        }

        let isMounted = true;

        void cities(selectedProvinceCode).then((allCities: unknown) => {
            if (!isMounted) {
                return;
            }

            const normalizedCities = isRecordArray(allCities)
                ? (allCities as CityOption[])
                : [];

            setCityOptions(normalizedCities);

            if (cityMunicipality) {
                const match = normalizedCities.find(
                    (item) => item.city_name === cityMunicipality,
                );

                if (match) {
                    setSelectedCityCode(match.city_code);

                    return;
                }
            }

            setSelectedCityCode('');
        });

        return () => {
            isMounted = false;
        };
    }, [selectedProvinceCode]);

    // Sync selectedCityCode when cityMunicipality prop changes
    useEffect(() => {
        if (!cityMunicipality || cityOptions.length === 0) {
            if (!cityMunicipality) {
                setSelectedCityCode('');
            }

            return;
        }

        const match = cityOptions.find(
            (item) => item.city_name === cityMunicipality,
        );

        if (match && match.city_code !== selectedCityCode) {
            setSelectedCityCode(match.city_code);
        }
    }, [cityMunicipality, cityOptions]);

    // Fetch barangays when selectedCityCode changes
    useEffect(() => {
        if (!selectedCityCode) {
            setBarangayOptions([]);

            return;
        }

        let isMounted = true;

        void barangays(selectedCityCode).then((allBarangays: unknown) => {
            if (!isMounted) {
                return;
            }

            const normalizedBarangays = isRecordArray(allBarangays)
                ? (allBarangays as BarangayOption[])
                : [];

            setBarangayOptions(normalizedBarangays);
        });

        return () => {
            isMounted = false;
        };
    }, [selectedCityCode]);

    const handleRegionChange = (nextRegion: string) => {
        const selected = regionOptions.find(
            (option) => option.region_name === nextRegion,
        );

        setSelectedRegionCode(selected?.region_code ?? '');
        setSelectedProvinceCode('');
        setSelectedCityCode('');
        setProvinceOptions([]);
        setCityOptions([]);
        setBarangayOptions([]);

        onChange('region', nextRegion);
        onChange('province', '');
        onChange('city_municipality', '');
        onChange('barangay', '');
    };

    const handleProvinceChange = (nextProvince: string) => {
        const selected = provinceOptions.find(
            (option) => option.province_name === nextProvince,
        );

        setSelectedProvinceCode(selected?.province_code ?? '');
        setSelectedCityCode('');
        setCityOptions([]);
        setBarangayOptions([]);

        onChange('province', nextProvince);
        onChange('city_municipality', '');
        onChange('barangay', '');
    };

    const handleCityChange = (nextCity: string) => {
        const selected = cityOptions.find(
            (option) => option.city_name === nextCity,
        );

        setSelectedCityCode(selected?.city_code ?? '');
        setBarangayOptions([]);

        onChange('city_municipality', nextCity);
        onChange('barangay', '');
    };

    const triggerClasses = cn(
        'w-full rounded-xl border border-input bg-background px-3 font-medium text-foreground shadow-xs transition-colors hover:bg-accent/30 focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50',
        compact ? 'h-9 text-xs' : 'h-10 text-sm',
    );

    const labelClasses = compact
        ? 'text-[11px] font-semibold text-foreground'
        : 'text-xs font-semibold text-foreground';

    return (
        <div
            className={
                compact
                    ? 'grid gap-2.5 sm:grid-cols-2'
                    : 'grid gap-4 sm:grid-cols-2'
            }
        >
            <div className="space-y-1">
                <Label htmlFor="region" className={labelClasses}>
                    Region
                </Label>
                <Select
                    value={region || undefined}
                    onValueChange={handleRegionChange}
                >
                    <SelectTrigger className={triggerClasses}>
                        <SelectValue placeholder="Select Region" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 w-[var(--radix-select-trigger-width)] min-w-[200px] overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg sm:max-h-56">
                        {regionOptions.map((option) => (
                            <SelectItem
                                key={option.region_code}
                                value={option.region_name}
                                className="cursor-pointer text-xs focus:bg-accent focus:text-accent-foreground"
                            >
                                {option.region_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1">
                <Label htmlFor="province" className={labelClasses}>
                    Province
                </Label>
                <Select
                    value={province || undefined}
                    onValueChange={handleProvinceChange}
                    disabled={!selectedRegionCode}
                >
                    <SelectTrigger className={triggerClasses}>
                        <SelectValue placeholder="Select Province" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 w-[var(--radix-select-trigger-width)] min-w-[200px] overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg sm:max-h-56">
                        {provinceOptions.map((option) => (
                            <SelectItem
                                key={option.province_code}
                                value={option.province_name}
                                className="cursor-pointer text-xs focus:bg-accent focus:text-accent-foreground"
                            >
                                {option.province_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1">
                <Label htmlFor="city-municipality" className={labelClasses}>
                    Municipality / City
                </Label>
                <Select
                    value={cityMunicipality || undefined}
                    onValueChange={handleCityChange}
                    disabled={!selectedProvinceCode}
                >
                    <SelectTrigger className={triggerClasses}>
                        <SelectValue placeholder="Select Municipality / City" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 w-[var(--radix-select-trigger-width)] min-w-[200px] overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg sm:max-h-56">
                        {cityOptions.map((option) => (
                            <SelectItem
                                key={option.city_code}
                                value={option.city_name}
                                className="cursor-pointer text-xs focus:bg-accent focus:text-accent-foreground"
                            >
                                {option.city_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-1">
                <Label htmlFor="barangay" className={labelClasses}>
                    Barangay
                </Label>
                <Select
                    value={barangay || undefined}
                    onValueChange={(value) => onChange('barangay', value)}
                    disabled={!selectedCityCode}
                >
                    <SelectTrigger className={triggerClasses}>
                        <SelectValue placeholder="Select Barangay" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48 w-[var(--radix-select-trigger-width)] min-w-[200px] overflow-y-auto rounded-xl border border-border bg-popover text-popover-foreground shadow-lg sm:max-h-56">
                        {barangayOptions.map((option) => (
                            <SelectItem
                                key={option.brgy_code}
                                value={option.brgy_name}
                                className="cursor-pointer text-xs focus:bg-accent focus:text-accent-foreground"
                            >
                                {option.brgy_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
