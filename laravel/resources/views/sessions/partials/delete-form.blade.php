@can('delete', $session)
    <form method="POST" action="{{ route('sessions.destroy', $session) }}" onsubmit="return confirm('Remove this session from your history?');">
        @csrf
        @method('DELETE')
        <button type="submit" class="text-xs font-medium text-red-700 hover:text-red-900">Delete</button>
    </form>
@endcan
