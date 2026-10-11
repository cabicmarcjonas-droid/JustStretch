<button {{ $attributes->merge(['type' => 'button', 'class' => 'inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-line rounded-full font-medium text-sm text-ink hover:border-ink focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper disabled:opacity-25 transition ease-in-out duration-150']) }}>
    {{ $slot }}
</button>
