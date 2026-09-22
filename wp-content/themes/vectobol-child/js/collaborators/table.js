export function createTable(
    container,
    collaborators
) {

        const t =
        window.VECTOBOL_I18N?.t
        ||
        ((key) => key);

    function formatRoles(roles = {}) {


        const labels = [];


        if (roles.echantillonnage)
            labels.push(
                t("role_echantillonnage")
            );


        if (roles.montage)
            labels.push(
                t("role_montage")
            );


        if (roles.identification)
            labels.push(
                t("role_identification")
            );


        if (roles.collection)
            labels.push(
                t("role_collection")
            );


        if (roles.fiche_espece)
            labels.push(
                t("role_fiche_espece")
            );


        if (roles.maintenance_listes)
            labels.push(
                t("role_maintenance_listes")
            );


        return labels.join(" · ");

    }




    let html = `


<table id="vb-collaborators">


<thead>

<tr>

<th>${t("collaborators_name")}</th>

<th>${t("collaborators_institution")}</th>

<th>${t("collaborators_country")}</th>

<th>${t("collaborators_roles")}</th>

</tr>

</thead>


<tbody>

`;



    collaborators.forEach(c => {


        html += `


<tr>


<td>
${c.nom ?? ""} ${c.prenom ?? ""}
</td>


<td>
${c.institution ?? ""}
</td>


<td>
${c.pays ?? ""}
</td>


<td>
${formatRoles(c.roles)}
</td>


</tr>


`;


    });



    html += `

</tbody>

</table>

`;



    container.innerHTML = html;


}