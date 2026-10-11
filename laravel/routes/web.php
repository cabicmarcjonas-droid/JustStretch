<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExerciseController;
use App\Http\Controllers\PageController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StretchSessionController;
use Illuminate\Support\Facades\Route;

// Public
Route::get('/', [PageController::class, 'home'])->name('home');
Route::get('/about', [PageController::class, 'about'])->name('about');

// Authenticated
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    Route::resource('exercises', ExerciseController::class);

    Route::get('/exercises/{exercise}/session', [StretchSessionController::class, 'create'])
        ->name('exercises.session');
    Route::post('/exercises/{exercise}/sessions', [StretchSessionController::class, 'store'])
        ->name('exercises.sessions.store');

    Route::get('/sessions', [StretchSessionController::class, 'index'])->name('sessions.index');
    Route::delete('/sessions/{stretchSession}', [StretchSessionController::class, 'destroy'])
        ->name('sessions.destroy');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
