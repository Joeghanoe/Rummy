export default function DrawPile({
    onClick
}: {
    onClick: () => void
}) {
    return (
        <svg onClick={onClick} width="95.80px" height="140px" className="cursor-pointer">
            <image href="./backface.png" width="91%" className="pointer-events-none"></image>
        </svg>
    )
}
