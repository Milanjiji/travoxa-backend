import { TourPackage, tourData } from "./tourData.js";

export type { TourPackage };
export { tourData as tourPackages };

export function getPackageById(id: string): TourPackage | undefined {
    return tourData.find((pkg) => pkg.id === id);
}
