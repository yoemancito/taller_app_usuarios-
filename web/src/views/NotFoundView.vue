<template>
    <section class="not-found">
        <p class="not-found__code">404</p>
        <h1>Página no encontrada</h1>
        <p class="text-muted">La dirección que buscas no existe o fue movida.</p>
        <RouterLink :to="{ name: 'home' }" class="btn btn--primary" data-test="go-home">Ir al inicio</RouterLink>
    </section>
</template>
