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
};

const isRecordArray = (value: unknown): value is Record<string, unknown>[] =>
    Array.isArray(value);

export function PhilippineAddressSelectors({
    region,
    province,
    cityMunicipality,
    barangay,
    onChange,
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

    useEffect(() => {
        if (!selectedRegionCode) {
            setProvinceOptions([]);
            setSelectedProvinceCode('');

            if (province) {
                onChange('province', '');
            }

            if (cityMunicipality) {
                onChange('city_municipality', '');
            }

            if (barangay) {
                onChange('barangay', '');
            }

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

            if (province) {
                onChange('province', '');
            }

            if (cityMunicipality) {
                onChange('city_municipality', '');
            }

            if (barangay) {
                onChange('barangay', '');
            }
        });

        return () => {
            isMounted = false;
        };
    }, [selectedRegionCode]);

    useEffect(() => {
        if (!selectedProvinceCode) {
            setCityOptions([]);
            setSelectedCityCode('');

            if (cityMunicipality) {
                onChange('city_municipality', '');
            }

            if (barangay) {
                onChange('barangay', '');
            }

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

            if (cityMunicipality) {
                onChange('city_municipality', '');
            }

            if (barangay) {
                onChange('barangay', '');
            }
        });

        return () => {
            isMounted = false;
        };
    }, [selectedProvinceCode]);

    useEffect(() => {
        if (!selectedCityCode) {
            setBarangayOptions([]);

            if (barangay) {
                onChange('barangay', '');
            }

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

            if (barangay) {
                const match = normalizedBarangays.find(
                    (item) => item.brgy_name === barangay,
                );

                if (!match && barangay) {
                    onChange('barangay', '');
                }
            }
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

    return (
        <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
                <Label
                    htmlFor="region"
                    className="text-xs font-bold text-foreground"
                >
                    Region
                </Label>
                <Select
                    value={region || undefined}
                    onValueChange={handleRegionChange}
                >
                    <SelectTrigger className="h-11 rounded-xl border-border/80 text-sm font-medium">
                        <SelectValue placeholder="Select Region" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 rounded-xl">
                        {regionOptions.map((option) => (
                            <SelectItem
                                key={option.region_code}
                                value={option.region_name}
                                className="cursor-pointer"
                            >
                                {option.region_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label
                    htmlFor="province"
                    className="text-xs font-bold text-foreground"
                >
                    Province
                </Label>
                <Select
                    value={province || undefined}
                    onValueChange={handleProvinceChange}
                    disabled={!selectedRegionCode}
                >
                    <SelectTrigger className="h-11 rounded-xl border-border/80 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60">
                        <SelectValue placeholder="Select Province" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 rounded-xl">
                        {provinceOptions.map((option) => (
                            <SelectItem
                                key={option.province_code}
                                value={option.province_name}
                                className="cursor-pointer"
                            >
                                {option.province_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label
                    htmlFor="city-municipality"
                    className="text-xs font-bold text-foreground"
                >
                    Municipality / City
                </Label>
                <Select
                    value={cityMunicipality || undefined}
                    onValueChange={handleCityChange}
                    disabled={!selectedProvinceCode}
                >
                    <SelectTrigger className="h-11 rounded-xl border-border/80 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60">
                        <SelectValue placeholder="Select Municipality / City" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 rounded-xl">
                        {cityOptions.map((option) => (
                            <SelectItem
                                key={option.city_code}
                                value={option.city_name}
                                className="cursor-pointer"
                            >
                                {option.city_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label
                    htmlFor="barangay"
                    className="text-xs font-bold text-foreground"
                >
                    Barangay
                </Label>
                <Select
                    value={barangay || undefined}
                    onValueChange={(value) => onChange('barangay', value)}
                    disabled={!selectedCityCode}
                >
                    <SelectTrigger className="h-11 rounded-xl border-border/80 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60">
                        <SelectValue placeholder="Select Barangay" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64 rounded-xl">
                        {barangayOptions.map((option) => (
                            <SelectItem
                                key={option.brgy_code}
                                value={option.brgy_name}
                                className="cursor-pointer"
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
