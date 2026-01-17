import json
import os
import random
from datetime import datetime
from collections import Counter

DATA_FILE = "powerball_data.json"


# ==========================
#   MANEJO DE ARCHIVO / DATA
# ==========================

def cargar_datos():
    if not os.path.exists(DATA_FILE):
        return []

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            combinaciones = json.load(f)
    except Exception:
        print("⚠️ No se pudo leer el archivo de datos. Se empezará con una lista vacía.")
        return []

    # Asegurar que las combinaciones antiguas tengan los nuevos campos
    for comb in combinaciones:
        if "favorita" not in comb:
            comb["favorita"] = False
        if "fecha_sorteo" not in comb:
            comb["fecha_sorteo"] = None
        if "fecha_registro" not in comb:
            comb["fecha_registro"] = None

    return combinaciones


def guardar_datos(combinaciones):
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(combinaciones, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"⚠️ Error guardando datos: {e}")


# ==========================
#   VALIDACIONES Y ENTRADA
# ==========================

def validar_numeros(blancos, powerball):
    # Validar cantidad
    if len(blancos) != 5:
        print("❌ Debes ingresar exactamente 5 números blancos.")
        return False

    # Validar rango y duplicados
    for n in blancos:
        if n < 1 or n > 69:
            print("❌ Los números blancos deben estar entre 1 y 69.")
            return False

    if len(set(blancos)) != 5:
        print("❌ Los números blancos no pueden repetirse.")
        return False

    # Validar powerball
    if powerball < 1 or powerball > 26:
        print("❌ El número Powerball debe estar entre 1 y 26.")
        return False

    return True


def pedir_combinacion(modo="jugada"):
    """
    modo = "jugada" para cuando guardas tus números
    modo = "ganadora" para cuando ingresas el resultado del sorteo
    """
    print("\nIngresa los números de Powerball.")
    print("Formato: 5 números blancos separados por espacios y luego el Powerball.")
    print("Ejemplo: 7 12 19 28 34 10 (los primeros 5 son blancos, el último es Powerball)\n")

    entrada = input("Escribe los 5 blancos y el Powerball: ").strip()

    partes = entrada.split()
    if len(partes) != 6:
        print("❌ Debes ingresar exactamente 6 números (5 blancos + 1 Powerball).")
        return None

    try:
        numeros = [int(x) for x in partes]
    except ValueError:
        print("❌ Solo se permiten números enteros.")
        return None

    blancos = numeros[:5]
    powerball = numeros[5]

    if not validar_numeros(blancos, powerball):
        return None

    blancos_ordenados = sorted(blancos)

    datos = {
        "blancos": blancos_ordenados,
        "powerball": powerball,
    }

    if modo == "jugada":
        # Preguntar por la fecha del sorteo (opcional)
        print("\nOpcional: fecha del sorteo donde usarás esta combinación.")
        print("Formato sugerido: AAAA-MM-DD (ejemplo: 2025-12-31)")
        fecha_sorteo = input("Fecha del sorteo (o deja vacío si no quieres ponerla): ").strip()
        if fecha_sorteo == "":
            fecha_sorteo = None

        datos["fecha_sorteo"] = fecha_sorteo
        datos["fecha_registro"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        datos["favorita"] = False

    return datos


# ==========================
#   OPERACIONES PRINCIPALES
# ==========================

def agregar_combinacion(combinaciones):
    comb = pedir_combinacion(modo="jugada")
    if comb is None:
        return

    # Asignar ID
    nuevo_id = 1
    if combinaciones:
        nuevo_id = max(c["id"] for c in combinaciones) + 1

    comb["id"] = nuevo_id
    combinaciones.append(comb)
    guardar_datos(combinaciones)
    print(f"✅ Combinación guardada con ID {nuevo_id}.")


def imprimir_combinaciones(lista):
    if not lista:
        print("\n(no hay combinaciones para mostrar)\n")
        return

    print("\n=== COMBINACIONES ===")
    for comb in lista:
        blancos_str = " ".join(f"{n:2d}" for n in comb["blancos"])
        estrella = "★" if comb.get("favorita", False) else " "
        fecha_sorteo = comb.get("fecha_sorteo") or "-"
        fecha_registro = comb.get("fecha_registro", "-")

        print(
            f"{estrella} ID: {comb['id']:3d} | Blancos: {blancos_str} | "
            f"Powerball: {comb['powerball']:2d} | Sorteo: {fecha_sorteo} | "
            f"Guardado: {fecha_registro}"
        )
    print("★ = favorita")
    print("===================================\n")


def mostrar_combinaciones(combinaciones):
    if not combinaciones:
        print("\n(no hay combinaciones guardadas aún)\n")
        return
    imprimir_combinaciones(combinaciones)


def borrar_combinacion(combinaciones):
    if not combinaciones:
        print("⚠️ No hay combinaciones para borrar.")
        return

    try:
        id_str = input("Ingresa el ID de la combinación que quieres borrar: ").strip()
        id_objetivo = int(id_str)
    except ValueError:
        print("❌ ID inválido.")
        return

    for i, comb in enumerate(combinaciones):
        if comb["id"] == id_objetivo:
            print("Combinación encontrada:")
            blancos_str = " ".join(str(n) for n in comb["blancos"])
            print(f"Blancos: {blancos_str} | Powerball: {comb['powerball']}")
            confirmar = input("¿Seguro que deseas borrarla? (s/n): ").strip().lower()
            if confirmar == "s":
                combinaciones.pop(i)
                guardar_datos(combinaciones)
                print("✅ Combinación borrada.")
            else:
                print("❌ Operación cancelada.")
            return

    print("❌ No se encontró ninguna combinación con ese ID.")


def alternar_favorita(combinaciones):
    if not combinaciones:
        print("⚠️ No hay combinaciones guardadas.")
        return

    try:
        id_str = input("Ingresa el ID de la combinación que quieres marcar/desmarcar como favorita: ").strip()
        id_objetivo = int(id_str)
    except ValueError:
        print("❌ ID inválido.")
        return

    for comb in combinaciones:
        if comb["id"] == id_objetivo:
            comb["favorita"] = not comb.get("favorita", False)
            estado = "FAVORITA" if comb["favorita"] else "NO favorita"
            guardar_datos(combinaciones)
            print(f"✅ La combinación con ID {id_objetivo} ahora está marcada como: {estado}.")
            return

    print("❌ No se encontró ninguna combinación con ese ID.")


def editar_fecha_sorteo(combinaciones):
    if not combinaciones:
        print("⚠️ No hay combinaciones guardadas.")
        return

    try:
        id_str = input("Ingresa el ID de la combinación cuya fecha de sorteo quieres cambiar: ").strip()
        id_objetivo = int(id_str)
    except ValueError:
        print("❌ ID inválido.")
        return

    for comb in combinaciones:
        if comb["id"] == id_objetivo:
            print("Combinación encontrada:")
            blancos_str = " ".join(str(n) for n in comb["blancos"])
            print(f"Blancos: {blancos_str} | Powerball: {comb['powerball']}")
            print(f"Fecha de sorteo actual: {comb.get('fecha_sorteo') or '-'}")
            print("Formato sugerido: AAAA-MM-DD (ejemplo: 2025-12-31)")
            nueva_fecha = input("Nueva fecha de sorteo (o deja vacío para eliminarla): ").strip()
            if nueva_fecha == "":
                nueva_fecha = None
            comb["fecha_sorteo"] = nueva_fecha
            guardar_datos(combinaciones)
            print("✅ Fecha de sorteo actualizada.")
            return

    print("❌ No se encontró ninguna combinación con ese ID.")


# ==========================
#   FILTROS
# ==========================

def ver_con_filtros(combinaciones):
    if not combinaciones:
        print("⚠️ No hay combinaciones guardadas para filtrar.")
        return

    while True:
        print("\n====== FILTROS ======")
        print("1. Ver solo combinaciones favoritas")
        print("2. Ver por fecha de sorteo exacta (AAAA-MM-DD)")
        print("3. Ver por rango de fechas de sorteo")
        print("4. Volver al menú principal")
        print("======================")

        op = input("Elige una opción (1-4): ").strip()

        if op == "1":
            filtradas = [c for c in combinaciones if c.get("favorita", False)]
            print("\n--- SOLO FAVORITAS ---")
            imprimir_combinaciones(filtradas)

        elif op == "2":
            fecha = input("Ingresa la fecha de sorteo (AAAA-MM-DD): ").strip()
            filtradas = [c for c in combinaciones if c.get("fecha_sorteo") == fecha]
            print(f"\n--- FECHA EXACTA: {fecha} ---")
            imprimir_combinaciones(filtradas)

        elif op == "3":
            desde = input("Fecha desde (AAAA-MM-DD): ").strip()
            hasta = input("Fecha hasta (AAAA-MM-DD): ").strip()
            filtradas = []
            for c in combinaciones:
                fs = c.get("fecha_sorteo")
                if fs is None:
                    continue
                # Como el formato es AAAA-MM-DD, la comparación de strings funciona bien para rangos sencillos
                if desde <= fs <= hasta:
                    filtradas.append(c)
            print(f"\n--- RANGO {desde} a {hasta} ---")
            imprimir_combinaciones(filtradas)

        elif op == "4":
            break
        else:
            print("❌ Opción no válida.\n")


# ==========================
#   ESTADÍSTICAS
# ==========================

def mostrar_estadisticas(combinaciones):
    if not combinaciones:
        print("⚠️ No hay combinaciones guardadas, no se pueden generar estadísticas.")
        return

    contador_blancos = Counter()
    contador_powerball = Counter()

    for comb in combinaciones:
        for n in comb["blancos"]:
            contador_blancos[n] += 1
        contador_powerball[comb["powerball"]] += 1

    print("\n===== ESTADÍSTICAS DE NÚMEROS BLANCOS =====")
    for numero, veces in contador_blancos.most_common():
        print(f"Número {numero:2d} apareció {veces} vez/veces")
    print("===========================================\n")

    print("===== ESTADÍSTICAS DE NÚMEROS POWERBALL =====")
    for numero, veces in contador_powerball.most_common():
        print(f"Powerball {numero:2d} apareció {veces} vez/veces")
    print("==============================================\n")


# ==========================
#   COMPARAR CON RESULTADO
# ==========================

def comparar_con_resultado(combinaciones):
    if not combinaciones:
        print("⚠️ No hay combinaciones guardadas para comparar.")
        return

    print("\n=== INGRESAR RESULTADO GANADOR DEL SORTEO ===")
    resultado = pedir_combinacion(modo="ganadora")
    if resultado is None:
        return

    blancos_ganadores = set(resultado["blancos"])
    powerball_ganador = resultado["powerball"]

    print("\n=== RESULTADOS DE LA COMPARACIÓN ===")
    hubo_alguna = False

    for comb in combinaciones:
        coincidencias_blancos = len(blancos_ganadores.intersection(comb["blancos"]))
        coincide_powerball = (comb["powerball"] == powerball_ganador)

        if coincidencias_blancos > 0 or coincide_powerball:
            hubo_alguna = True
            blancos_str = " ".join(f"{n:2d}" for n in comb["blancos"])
            texto_power = "SÍ" if coincide_powerball else "NO"
            print(
                f"ID {comb['id']:3d} | Blancos: {blancos_str} | PB: {comb['powerball']:2d} | "
                f"Coincidencias blancos: {coincidencias_blancos} | Coincide Powerball: {texto_power}"
            )

    if not hubo_alguna:
        print("Ninguna de tus combinaciones tuvo coincidencias con este resultado.")
    print("=====================================\n")


# ==========================
#   EXPORTAR REPORTE
# ==========================

def exportar_reporte(combinaciones):
    if not combinaciones:
        print("⚠️ No hay combinaciones para exportar.")
        return

    print("\n¿Quieres exportar?")
    print("1. Todas las combinaciones")
    print("2. Solo favoritas")
    elec = input("Elige opción (1-2): ").strip()

    if elec == "2":
        datos = [c for c in combinaciones if c.get("favorita", False)]
        sufijo = "_favoritas"
    else:
        datos = list(combinaciones)
        sufijo = "_todas"

    if not datos:
        print("⚠️ No hay combinaciones para ese filtro.")
        return

    # TXT
    nombre_txt = f"reporte_powerball{sufijo}.txt"
    with open(nombre_txt, "w", encoding="utf-8") as f:
        f.write("REPORTE POWERBALL\n")
        f.write("=================\n\n")
        for comb in datos:
            blancos_str = " ".join(str(n) for n in comb["blancos"])
            estrella = "★" if comb.get("favorita", False) else " "
            f.write(
                f"{estrella} ID: {comb['id']} | Blancos: {blancos_str} | "
                f"Powerball: {comb['powerball']} | Sorteo: {comb.get('fecha_sorteo') or '-'} | "
                f"Guardado: {comb.get('fecha_registro', '-')}\n"
            )

    # CSV
    nombre_csv = f"reporte_powerball{sufijo}.csv"
    with open(nombre_csv, "w", encoding="utf-8") as f:
        f.write("id,blanco1,blanco2,blanco3,blanco4,blanco5,powerball,fecha_sorteo,fecha_registro,favorita\n")
        for comb in datos:
            blancos = comb["blancos"]
            favorita_str = "1" if comb.get("favorita", False) else "0"
            f.write(
                f"{comb['id']},{blancos[0]},{blancos[1]},{blancos[2]},"
                f"{blancos[3]},{blancos[4]},{comb['powerball']},"
                f"{comb.get('fecha_sorteo') or ''},{comb.get('fecha_registro', '')},{favorita_str}\n"
            )

    print(f"✅ Reporte exportado como '{nombre_txt}' y '{nombre_csv}' en la misma carpeta del programa.\n")

def seleccionar_conjunto_para_simulacion(combinaciones):
    if not combinaciones:
        print("⚠️ No hay combinaciones guardadas.")
        return None

    print("\n¿Con qué combinaciones quieres simular?")
    print("1. Todas las combinaciones")
    print("2. Solo favoritas")
    print("3. Una sola combinación (por ID)")
    op = input("Elige opción (1-3): ").strip()

    if op == "1":
        return list(combinaciones)

    elif op == "2":
        favoritas = [c for c in combinaciones if c.get("favorita", False)]
        if not favoritas:
            print("⚠️ No tienes combinaciones marcadas como favoritas.")
            return None
        return favoritas

    elif op == "3":
        try:
            id_str = input("Ingresa el ID de la combinación: ").strip()
            id_obj = int(id_str)
        except ValueError:
            print("❌ ID inválido.")
            return None

        for c in combinaciones:
            if c["id"] == id_obj:
                return [c]

        print("❌ No se encontró ninguna combinación con ese ID.")
        return None

    else:
        print("❌ Opción no válida.")
        return None

# ==========================
#   SIMULACIONES
# ==========================

def simular_sorteos(combinaciones):
    if not combinaciones:
        print("⚠️ No hay combinaciones guardadas para simular.")
        return

    # Elegir con qué combinaciones trabajar
    lista_sim = seleccionar_conjunto_para_simulacion(combinaciones)
    if not lista_sim:
        return

    # Info al usuario
    if len(lista_sim) == len(combinaciones):
        desc = "todas tus combinaciones"
    elif len(lista_sim) == 1:
        desc = f"la combinación con ID {lista_sim[0]['id']}"
    else:
        desc = f"{len(lista_sim)} combinación(es) seleccionadas"

    try:
        n_str = input(f"¿Cuántos sorteos aleatorios quieres simular con {desc}? (ej: 1000): ").strip()
        n_sims = int(n_str)
        if n_sims <= 0:
            raise ValueError
    except ValueError:
        print("❌ Número inválido.")
        return

    print(f"\nSimulando {n_sims} sorteos aleatorios con {desc}...")

    # stats[(coincidencias_blancos, coincide_powerball)] = cantidad_de_veces
    stats = Counter()

    for _ in range(n_sims):
        # Generar resultado aleatorio (reglas estándar Powerball)
        blancos_ganadores = set(random.sample(range(1, 70), 5))
        powerball_ganador = random.randint(1, 26)

        for comb in lista_sim:
            coincidencias_blancos = len(blancos_ganadores.intersection(comb["blancos"]))
            coincide_powerball = (comb["powerball"] == powerball_ganador)
            clave = (coincidencias_blancos, coincide_powerball)
            stats[clave] += 1

    print("\n=== RESULTADOS DE LA SIMULACIÓN ===")
    total_jugadas = n_sims * len(lista_sim)
    for (c_blancos, c_pb), veces in sorted(stats.items(), key=lambda x: (-x[0][0], -int(x[0][1]))):
        texto_pb = "con Powerball acertado" if c_pb else "sin Powerball acertado"
        prob = veces / total_jugadas * 100.0
        print(
            f"{veces} veces hubo combinaciones con {c_blancos} blancos {texto_pb} "
            f"({prob:.6f}% de todas las jugadas simuladas)"
        )
    print("====================================\n")
