import NextLink from "next/link";
import { forwardRef } from "react";

const Link = forwardRef((props: any, ref: any) => {
    let { href, children, ...rest } = props
    return (
        <NextLink href={href} >
            <a ref={ref} {...rest}>
                {children}
            </a>
        </NextLink>
    )
})

Link.displayName = "MyLink";

export default Link;