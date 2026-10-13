<button {{ $attributes->merge(['type' => 'submit', 'class' => 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent border border-transparent rounded-full font-medium text-sm text-white hover:bg-accent-dark focus:bg-accent-dark active:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper disabled:opacity-50 transition ease-in-out duration-150']) }}>
    {{ $slot }}
</button>
