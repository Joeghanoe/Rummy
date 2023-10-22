import { CardExtensions } from "../utils/cardExtensions"

export default function DrawPile({
    onClick,
}: {
    onClick: () => void
}) {
    const aspectRatio = 0.6842857142857143
    const width = CardExtensions.size * aspectRatio

    return (
        <svg onClick={onClick} width={width} height={CardExtensions.size} className="cursor-pointer">
            <image href="./backface.png" width="90.5%" className="pointer-events-none" y={CardExtensions.size * 0.035}></image>
        </svg>
    )
}
