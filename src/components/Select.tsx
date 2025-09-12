type Option = {
    label: string,
    value: string | number,
    id: string | number
}

type Props = {
    options: Option[],
    onSelect?: (value: string) => void,
    name: string,
    id?: string,
    loading?: boolean
}
export default function Select({ options = [], name = "", id = "", loading = false, onSelect = () => { } }: Props) {
    return (
        <select id={id} name={name} onChange={(event) => onSelect(event.currentTarget.value)} className={`${loading && 'animate-pulse'}bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500`}>
            {options?.map(option => <option key={option.id} value={option.value}>{option.label}</option>)}
        </select>
    )
}
