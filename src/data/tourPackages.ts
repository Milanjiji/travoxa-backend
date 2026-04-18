import { TourPackage, tourData } from "./tourData";

export type { TourPackage };
export { tourData as tourPackages };

export function getPackageById(id: string): TourPackage | undefined {
    return tourData.find((pkg) => pkg.id === id);
}
