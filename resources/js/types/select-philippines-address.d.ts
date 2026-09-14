declare module 'select-philippines-address' {
    export type RegionRecord = {
        id?: string | number;
        psgc_code?: string;
        region_name: string;
        region_code: string;
    };

    export type ProvinceRecord = {
        psgc_code?: string;
        province_name: string;
        province_code: string;
        region_code?: string;
    };

    export type CityRecord = {
        city_name: string;
        city_code: string;
        province_code?: string;
        region_desc?: string;
    };

    export type BarangayRecord = {
        brgy_name: string;
        brgy_code: string;
        province_code?: string;
        region_code?: string;
    };

    export function regions(): Promise<RegionRecord[]>;
    export function provinceByName(
        name: string,
    ): Promise<ProvinceRecord | undefined>;
    export function provinces(regionCode: string): Promise<ProvinceRecord[]>;
    export function cities(provinceCode: string): Promise<CityRecord[]>;
    export function barangays(cityCode: string): Promise<BarangayRecord[]>;
}
