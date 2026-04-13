import React from "react"
import Image from "next/image"
import { ASSET_CONSTANTS } from "@/core/constants/asset-constants"

type LogoProps = {
  size?: number;
} & Omit<React.ComponentProps<typeof Image> , 'alt' | 'src'>;
const Logo: React.FC<LogoProps> = (
  {size = 20, ...rest}
) => {
  return (
    <Image
      src={ASSET_CONSTANTS.LOGO}
      alt={"Logo"}
      width={size}
      height={size}
      {...rest}
    />
  );
};

export default Logo;