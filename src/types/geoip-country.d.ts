declare module "geoip-country" {
    export type GeoIpCountryResult = {
        country: string;
        name?: string;
        continent?: string;
    };

    export function lookup(ip: string): GeoIpCountryResult | null;
}
